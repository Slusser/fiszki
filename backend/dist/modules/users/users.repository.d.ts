import { DatabaseService } from '../../common/database/database.service';
import { MeResponseDto } from './dto/me-response.dto';
export declare class UsersRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getProfileAndWallet(userId: string): Promise<Omit<MeResponseDto, 'email'>>;
}
