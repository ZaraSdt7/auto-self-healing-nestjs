import { Injectable } from '@nestjs/common';
import { Logger } from './logger';

@Injectable()
export class QueryOptimizer {
  constructor(private logger: Logger) {}

  optimizeQuery(query: string): string {
    this.logger.debug(`Optimizing query: ${query}`);
    let optimizedQuery = query.trim();

    // remove extra spaces
    optimizedQuery = optimizedQuery.replace(/\s+/g, ' ');

    // check if the query has a where clause
    if (optimizedQuery.toLowerCase().includes('where')) {
      const whereClause = optimizedQuery
        .split(/where/i)[1]
        ?.trim()
        .split(' ')[0];
      if (whereClause) {
        this.logger.info(`Consider adding an index on column: ${whereClause}`);
      }
    }

    //
    if (optimizedQuery.toLowerCase().includes('join')) {
      optimizedQuery = this.simplifyJoins(optimizedQuery);
    }

    this.logger.debug(`Optimized query: ${optimizedQuery}`);
    return optimizedQuery;
  }

  private simplifyJoins(query: string): string {
    // check if the query has a join and if it has multiple joins
    const parts = query.split(/join/i);
    if (parts.length > 2) {
      this.logger.warn(
        'Multiple JOINs detected; consider breaking into subqueries for performance',
      );
    }
    return query; // for simplicity, just log for now
  }
}
