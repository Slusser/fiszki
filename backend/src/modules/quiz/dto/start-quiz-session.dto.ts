import { IsUUID } from 'class-validator';
import { QuizTierDto } from './quiz-tier.dto';

export class StartQuizSessionDto extends QuizTierDto {
  @IsUUID('4')
  categoryId!: string;
}
