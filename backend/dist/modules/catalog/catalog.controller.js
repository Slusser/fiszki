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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const catalog_service_1 = require("./catalog.service");
const category_id_param_dto_1 = require("./dto/category-id-param.dto");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    getCategories(user) {
        return this.catalogService.getCategories(user);
    }
    getCategoryTiers(user, params) {
        return this.catalogService.getCategoryTiers(user, params.categoryId);
    }
    unlockCategory(user, params) {
        return this.catalogService.unlockCategory(user, params.categoryId);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'List available categories and unlock status' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Categories fetched for current user' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('categories/:categoryId/tiers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tier progress for selected category' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Tier progression returned' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_id_param_dto_1.CategoryIdParamDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCategoryTiers", null);
__decorate([
    (0, common_1.Post)('categories/:categoryId/unlock'),
    (0, swagger_1.ApiOperation)({ summary: 'Unlock category by spending points' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Category unlocked or already unlocked' }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Insufficient points or invalid request',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Category unavailable' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_id_param_dto_1.CategoryIdParamDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "unlockCategory", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    (0, common_1.UseGuards)(auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiTags)('catalog'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map