"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let AuthRepository = class AuthRepository {
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    client = this.supabaseUrl && this.supabaseAnonKey
        ? (0, supabase_js_1.createClient)(this.supabaseUrl, this.supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        })
        : null;
    async getUserByAccessToken(accessToken) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Supabase auth is not configured (SUPABASE_URL / SUPABASE_ANON_KEY)');
        }
        const { data, error } = await this.client.auth.getUser(accessToken);
        if (error) {
            return null;
        }
        return data.user;
    }
};
exports.AuthRepository = AuthRepository;
exports.AuthRepository = AuthRepository = __decorate([
    (0, common_1.Injectable)()
], AuthRepository);
//# sourceMappingURL=auth.repository.js.map