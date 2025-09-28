import { prisma } from "./prisma";

/**
 * Utility class for common CRUD operations with Prisma
 */
export default class CrudOperations {
  constructor(private modelName: string) {}

  private get model() {
    // @ts-expect-error - Dynamic model access
    return prisma[this.modelName];
  }

  /**
   * Fetches multiple records with optional filtering, sorting, and pagination
   */
  async findMany(
    filters?: Record<string, any>,
    params?: {
      limit?: number;
      offset?: number;
      orderBy?: Record<string, "asc" | "desc">;
      include?: Record<string, any>;
    },
  ) {
    const { limit, offset, orderBy, include } = params || {};

    const options: any = {
      where: filters || {},
    };

    if (limit) {
      options.take = limit;
    }

    if (offset) {
      options.skip = offset;
    }

    if (orderBy) {
      options.orderBy = orderBy;
    }

    if (include) {
      options.include = include;
    }

    const data = await this.model.findMany(options);
    return data;
  }

  /**
   * Fetches a single record by its ID
   */
  async findById(id: string, include?: Record<string, any>) {
    const options: any = {
      where: { id },
    };

    if (include) {
      options.include = include;
    }

    const data = await this.model.findUnique(options);
    return data;
  }

  /**
   * Creates a new record in the table
   */
  async create(data: Record<string, any>, include?: Record<string, any>) {
    const options: any = {
      data,
    };

    if (include) {
      options.include = include;
    }

    const result = await this.model.create(options);
    return result;
  }

  /**
   * Updates an existing record by ID
   */
  async update(
    id: string,
    data: Record<string, any>,
    include?: Record<string, any>
  ) {
    const options: any = {
      where: { id },
      data,
    };

    if (include) {
      options.include = include;
    }

    const result = await this.model.update(options);
    return result;
  }

  /**
   * Deletes a record by ID
   */
  async delete(id: string) {
    await this.model.delete({
      where: { id }
    });

    return { id };
  }

  /**
   * Counts records matching the given filters
   */
  async count(filters?: Record<string, any>) {
    const count = await this.model.count({
      where: filters || {},
    });
    return count;
  }
}