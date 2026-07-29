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
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let SupabaseAuthGuard = class SupabaseAuthGuard {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractBearerToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        request.user = await this.authService.verifyAccessToken(token);
        return true;
    }
    extractBearerToken(request) {
        const rawHeader = request.headers.authorization;
        if (!rawHeader) {
            return null;
        }
        const [type, token] = rawHeader.split(' ');
        if (type?.toLowerCase() !== 'bearer' || !token) {
            return null;
        }
        return token;
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], SupabaseAuthGuard);
//# sourceMappingURL=auth.guard.js.map