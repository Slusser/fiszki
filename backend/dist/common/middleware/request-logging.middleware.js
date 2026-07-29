"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RequestLoggingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RequestLoggingMiddleware = RequestLoggingMiddleware_1 = class RequestLoggingMiddleware {
    logger = new common_1.Logger(RequestLoggingMiddleware_1.name);
    use(req, res, next) {
        const startedAt = Date.now();
        const { method, originalUrl } = req;
        res.on('finish', () => {
            const elapsedMs = Date.now() - startedAt;
            const contentLength = res.getHeader('content-length');
            this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${elapsedMs}ms${contentLength !== undefined ? ` ${String(contentLength)}b` : ''}`);
        });
        next();
    }
};
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
exports.RequestLoggingMiddleware = RequestLoggingMiddleware = RequestLoggingMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], RequestLoggingMiddleware);
//# sourceMappingURL=request-logging.middleware.js.map