import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { PaginateSubqueryOptions } from '../interfaces/paginated.interface';
import { SubqueryTotal } from '../types/sub-query-total.type';

@Injectable()
export class PaginationProvider {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * MSSQL-friendly paginator for ANY subquery.
   * - rowsQb: SELECT ... (can include GROUP BY). Avoid ORDER BY here.
   * - total: number or a QB whose getCount() matches the same domain.
   * - options.orderBy: ORDER BY expression(s) for ROW_NUMBER() (required).
   * - options.selectColumns: optional whitelist of output columns (use aliases from rowsQb).
   */
  public async paginateQuery<R = any>(
    rowsQb: SelectQueryBuilder<any>,
    total: SubqueryTotal,
    query: PaginationQueryDto,
    options: PaginateSubqueryOptions,
  ): Promise<{
    data: R[];
    pagination: {
      total: number;
      offset: number;
      limit: number;
      has_next: boolean;
    };
  }> {
    const noPaging =
      !query ||
      (query.offset === undefined && query.limit === undefined) ||
      (query as any)?.all === true;

    // Clamp only if paging; otherwise don’t constrain the result.
    const limit = noPaging ? 0 : Math.max(1, Math.min(query.limit ?? 10, 100));
    const offset = noPaging ? 0 : Math.max(0, query.offset ?? 0);

    // ORDER BY for ROW_NUMBER() is required
    if (
      !options?.orderBy ||
      (Array.isArray(options.orderBy) && options.orderBy.length === 0)
    ) {
      throw new Error(
        'paginateQuery: options.orderBy is required (ROW_NUMBER() needs ORDER BY).',
      );
    }
    const orderExpr = Array.isArray(options.orderBy)
      ? options.orderBy.join(', ')
      : options.orderBy;

    // Make sure the subquery has NO ORDER BY (MSSQL restriction).
    const rowsQbClean = rowsQb.clone();
    (rowsQbClean as any).expressionMap.orderBys = {};

    // Stage A: wrap base query and add ROW_NUMBER()
    const A = 'a1';
    const stageA = this.dataSource
      .createQueryBuilder()
      .select([`${A}.*`, `ROW_NUMBER() OVER (ORDER BY ${orderExpr}) AS no`])
      .from(`(${rowsQbClean.getQuery()})`, A)
      .setParameters(rowsQbClean.getParameters());

    // Stage B: apply slicing only when paging
    const B = 'b1';
    const stageB = this.dataSource
      .createQueryBuilder()
      .from(`(${stageA.getQuery()})`, B)
      .setParameters(stageA.getParameters());

    if (!noPaging) {
      stageB
        .where(`${B}.no > :__pg_offset`, { __pg_offset: offset })
        .andWhere(`${B}.no <= :__pg_to`, { __pg_to: offset + limit });
    }

    // Final projection
    if (options.selectColumns?.length) {
      stageB.select(options.selectColumns.map((c) => `${B}.${c} AS ${c}`));
      if (options.includeRowNumber) stageB.addSelect(`${B}.no`, 'no');
    } else {
      stageB.select([`${B}.*`]);
    }

    const rows = (await stageB.getRawMany<R>()) as Array<Record<string, any>>;
    if (!options.includeRowNumber) rows.forEach((r) => delete r.no);

    // Total count
    const totalCount =
      typeof total === 'number' ? total : await total.getCount();

    const has_next = !noPaging && offset + limit < totalCount;

    return {
      data: rows as R[],
      pagination: {
        total: totalCount,
        offset,
        limit: noPaging ? totalCount : limit,
        has_next,
      },
    };
  }
}
