import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
    
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;

    const totalPages = await this.product.count();
    const lastPage = Math.ceil(totalPages / limit);
    return {
      data: await this.product.findMany({
        skip: limit * (page - 1),
        take: limit,
        where: {
          available: true
        }
      }),
      meta: {
        page,
        totalPages,
        lastPage
      }
    } 
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: {
        id, available: true
      }
    });
    if(!product) {
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.NOT_FOUND
      });
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const {id: _, ...data} = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      where: {
        id
      },
      data: data
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.product.update({
      where: {
        id
      },
      data: {
        available: false
      }
    });
    // return this.product.delete({
    //   where: {
    //     id
    //   }
    // });
  }

  async validateProducts(ids: number[]) {    
    ids = Array.from(new Set(ids))
    const products = await this.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });    
    if(products.length !== ids.length) {
      throw new RpcException({
        message: 'Invalid product ids',
        status: HttpStatus.BAD_REQUEST
      });
    }
    
    return products;
  }  

}