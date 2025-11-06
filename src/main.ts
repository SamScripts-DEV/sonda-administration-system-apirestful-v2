import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpErrorFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { ProfileGuard } from './common/guards/profile.guard';
import { PrismaService } from './prisma/prisma.service';

function parseCsvEnv(name: string): string[] {
  const v = process.env[name];
  return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function parseRegexEnv(name: string): RegExp[] {
  return parseCsvEnv(name).map(p => {
    try { return new RegExp(p); } catch { return null; }
  }).filter(Boolean) as RegExp[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = parseCsvEnv('CORS_ORIGINS'); 
  const allowedRegexes = parseRegexEnv('CORS_REGEXES'); 
  const allowNoOrigin = process.env.CORS_ALLOW_NO_ORIGIN !== 'false'; 

  function isAllowedOrigin(origin?: string): boolean {
    if (!origin) return allowNoOrigin;
    if (allowedOrigins.includes(origin)) return true;
    for (const re of allowedRegexes) {
      if (re.test(origin)) return true;
    }
    return false;
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin as string | undefined)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400,
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.use(cookieParser());
  app.setGlobalPrefix('api/v2'); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
