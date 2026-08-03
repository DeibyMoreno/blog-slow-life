import type { RoleRepository } from "@application/shared/ports/outbound/role.repository.js"
import { CreateRoleSchema, type CreateRoleDTO } from "../dto/index.js"
import { Permission, Role } from "@domain/administration/entities/index.js"
import { UUID } from "@domain/shared/value-objects/uuid.vo.js"
import { RoleAlreadyExistsError } from "@domain/administration/errors/index.js"
import { ValidationError } from "@domain/shared/errors/index.js"

export class CreateRoleUseCase {
    constructor(private readonly roleRepository: RoleRepository) { }

    async execute(input: CreateRoleDTO) {
        const parsed = CreateRoleSchema.safeParse(input)

        if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))

        const data = parsed.data

        const existing = await this.roleRepository.findByName(data.name)
        if (existing) {
            throw new RoleAlreadyExistsError(data.name)
        }

        const permissions = (data.permissionIds ?? []).map(
            (id) => new Permission(UUID.from(id), '', '', null, new Date()),
        )

        const role = Role.create({
            name: data.name,
            description: data.description ?? null,
            permissions,
        })

        return this.roleRepository.save(role)
    }
}
