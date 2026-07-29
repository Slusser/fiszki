"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const wallet_ledger_query_dto_1 = require("./dto/wallet-ledger-query.dto");
const rewards_service_1 = require("./rewards.service");
let RewardsController = class RewardsController {
    rewardsService;
    constructor(rewardsService) {
        this.rewardsService = rewardsService;
    }
    getWallet(user) {
        return this.rewardsService.getWallet(user);
    }
    getLedger(user, query) {
        return this.rewardsService.getLedger(user, query.limit);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet balances' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Wallet snapshot returned' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet ledger entries' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Wallet ledger history returned' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, wallet_ledger_query_dto_1.WalletLedgerQueryDto]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getLedger", null);
exports.RewardsController = RewardsController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiTags)('wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rewards_service_1.RewardsService])
], RewardsController);
//# sourceMappingURL=rewards.controller.js.map