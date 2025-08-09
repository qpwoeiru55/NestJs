import { BadRequestException, Injectable } from '@nestjs/common';
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

  async applyCursorPagination<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto
  ) {
    let { cursor, take, order } = dto;

    // if (id) {
    //   const direction = order === 'ASC' ? '>' : '<';

    //   //order가 'ASC'일 때는 id가 큰 것부터
    //   qb.where(`${qb.alias}.id ${direction} :id`, { id });
    // }

    // qb.orderBy(`${qb.alias}.id`, order);

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      //  * 예시 데이터:
      //  * {
      //  *   values : {
      //  *     id: 27
      //  *   },
      //  *   order: ['id_DESC']
      //  * }

      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order; // ['id_DESC']

      // WHERE (column1 > value1)
      //   OR (column1 = value1 AND column2 < value2)
      //   OR (column1 = value1 AND column2 = value2 AND column3 > value3)
      //   OR (movie.column1, movie.column2, movie.column3) > (:value1, :value2, :value3)

      const values = cursorObj.values; // { id: 27 }
      ///(co1,col2,...,coln3) > (val1,val2,...,val3)
      const columns = Object.keys(values); // 'id'
      const comparisonOperator = order.some((o) => o.endsWith('DESC')) ? '<' : '>';
      // const whereconditions = columns.map((column) => `${qb.alias}.${column}`).join(',');
      // const whereParams = columns.map((column) => `:${column}`).join(',');
      const whereconditions = `(${columns.map((column) => `${qb.alias}."${column}"`).join(', ')})`;
      const whereParams = `(${columns.map((column) => `:${column}`).join(', ')})`;

      qb.andWhere(`${whereconditions} ${comparisonOperator} (${whereParams})`, values);
    }

    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('Order는 ASC 또는 DESC으로 입력해주세요!');
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany(); // 결과 조회

    const nextCursor = this.generateNextCursor<T>(results, order);

    return { qb, nextCursor }; // 쿼리 빌더와 다음 커서 반환
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) {
      return null; // 결과가 없으면 커서 생성 불필요
    }

    /**
     * 예시 데이터:
     * {
     *   values : {
     *     id: 27
     *   },
     *   order: ['id_DESC']
     * }
     *
     * 목적: 커서 기반 페이지네이션에서
     * 현재 페이지의 마지막 데이터를 기반으로
     * 다음 페이지를 조회할 수 있는 커서 객체 생성
     */

    // 현재 페이지 결과 중 마지막 데이터 → 커서 기준점
    const lastItem = results[results.length - 1];

    // 정렬에 사용된 컬럼들의 값을 담을 객체
    const values = {};

    // 정렬 기준 배열을 순회하며 컬럼 이름만 추출
    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_'); // 'id_DESC' → ['id', 'DESC'] → column = 'id'

      // 마지막 결과(lastItem)에서 해당 컬럼 값 추출
      values[column] = lastItem[column]; // 예: values['id'] = 27
    });

    // 최종 커서 객체 구성
    const cusroObj = {
      values, // { id: 27 }
      order, // ['id_DESC']
    };

    const nextCursor = Buffer.from(JSON.stringify(cusroObj)).toString('base64');
    // 커서 객체를 JSON 문자열로 변환 후 base64로 인코딩하여 반환

    return nextCursor; // base64로 인코딩된 커서 문자열 반환
  }
}
