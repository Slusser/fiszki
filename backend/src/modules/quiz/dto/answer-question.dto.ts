import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionToken!: string;

  @IsString()
  @IsNotEmpty()
  selectedOption!: string;
}
