import { Project } from "../entities/project.entity";
import { UserDetailsDTO } from "./user-details.dto";

export class ProjectDetailsDTO {
  constructor (
    readonly id: number,
    readonly title: string,
    readonly imageUrl: string,
    readonly likesCount: number,
    readonly description?: string,
    readonly user?: UserDetailsDTO
  ) {}

  static fromProjectEntity (projectEntity: Project) {
    const { id, title, description, imageUrl, user, likesCount } = projectEntity;
    const userDetails = UserDetailsDTO.fromUserEntity(user);
    return new ProjectDetailsDTO(id, title, imageUrl, likesCount, description, userDetails);
  }
}
