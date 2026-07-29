"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof common_1.HttpException ? exception.getResponse() : null;
        let code = 'INTERNAL_ERROR';
        let message = 'Internal server error';
        let details;
        if (exception instanceof common_1.HttpException) {
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object' &&
                exceptionResponse !== null) {
                const responseObj = exceptionResponse;
                message =
                    typeof responseObj.message === 'string'
                        ? responseObj.message
                        : exception.message;
                code =
                    typeof responseObj.error === 'string'
                        ? responseObj.error.toUpperCase().replaceAll(' ', '_')
                        : `HTTP_${status}`;
                details = responseObj;
            }
            else {
                message = exception.message;
                code = `HTTP_${status}`;
            }
        }
        if (status >= 500) {
            this.logger.error(`${request.method} ${request.url} -> ${status}: ${exception instanceof Error ? exception.message : String(exception)}`);
        }
        else {
            this.logger.warn(`${request.method} ${request.url} -> ${status}: ${message}`);
        }
        const payload = {
            success: false,
            error: {
                code,
                message,
                ...(details !== undefined ? { details } : {}),
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        response.status(status).json(payload);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map