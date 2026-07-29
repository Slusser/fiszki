import { IsUUID } from 'class-validator';

export class CategoryIdParamDto {
  @IsUUID('4')
  categoryId!: string;
}
