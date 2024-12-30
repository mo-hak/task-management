import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const { ip } = request;

    this.logger.debug(
      `Incoming Request - Method: ${method} URL: ${url} IP: ${ip} User-Agent: ${userAgent}`,
      { body },
    );

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.debug(
            `Outgoing Response - Method: ${method} URL: ${url} Status: ${
              response.statusCode
            } Duration: ${delay}ms`,
            { data },
          );
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `Request Error - Method: ${method} URL: ${url} Duration: ${delay}ms Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
} 