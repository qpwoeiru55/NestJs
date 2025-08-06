import { Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  aapplyPagination<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto) {
    const { page = 1, take = 5 } = dto;
    const skip = (page - 1) * take;
    return qb.skip(skip).take(take);
  }

  applyCursorPagination<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto
  ) {
    const { id, take, order } = dto;

    if (id) {
      const direction = order === 'ASC' ? '>' : '<';

      //order가 'ASC'일 때는 id가 큰 것부터
      qb.where(`${qb.alias}.id ${direction} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order);
    qb.take(take);
  }
}
