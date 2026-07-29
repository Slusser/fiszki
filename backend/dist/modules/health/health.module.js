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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthModule = exports.HealthController = exports.HealthService = exports.HealthRepository = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let HealthRepository = class HealthRepository {
    getChecks() {
        return {
            app: 'ok',
            database: 'unknown',
            supabase: 'not_configured',
        };
    }
};
exports.HealthRepository = HealthRepository;
exports.HealthRepository = HealthRepository = __decorate([
    (0, common_1.Injectable)()
], HealthRepository);
let HealthService = class HealthService {
    healthRepository;
    constructor(healthRepository) {
        this.healthRepository = healthRepository;
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
        };
    }
    getReadiness() {
        return {
            status: 'ready',
            checks: this.healthRepository.getChecks(),
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [HealthRepository])
], HealthService);
let HealthController = class HealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    getHealth() {
        return this.healthService.getHealth();
    }
    getReadiness() {
        return this.healthService.getReadiness();
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe endpoint' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Service is alive' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe endpoint' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Service is ready to serve traffic' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "getReadiness", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    (0, swagger_1.ApiTags)('health'),
    __metadata("design:paramtypes", [HealthService])
], HealthController);
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        controllers: [HealthController],
        providers: [HealthService, HealthRepository],
        exports: [HealthService, HealthRepository],
    })
], HealthModule);
//# sourceMappingURL=health.module.js.map