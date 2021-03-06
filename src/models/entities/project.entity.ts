import { BaseEntity } from './base.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationCount } from 'typeorm';
import { User } from './user.entity';
import { Like } from './like.entity';

@Entity({ name: 'projects' })
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 64, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: '1024', nullable: false })
  imageUrl: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne(type => User, user => user.projects)
  user: User;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany(type => Like, like => like.project)
  likes: Like[];

  @RelationCount((project: Project) => project.likes)
  likesCount: number;
}
