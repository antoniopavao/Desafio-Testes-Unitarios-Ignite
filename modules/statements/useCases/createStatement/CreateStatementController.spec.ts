import { Connection, createConnection } from "typeorm";

import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import request from "supertest";

import authConfig from "../../../../config/auth";
import { UsersRepository } from "@modules/users/repositories/UsersRepository";
import { StatementsRepository } from "../../repositories/StatementsRepository";
import { app } from "../../../../app";
import { User } from "../../../users/entities/User";

let connection: Connection;
let token: string;
let user: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    user = await usersRepository.create({
      email: "test@receiver.com",
      name: "User test",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a deposit statement", async () => {
    const depositStatement = {
      description: "Deposit statement",
      type: "Deposit" as OperationType,
      amount: 100,
    };

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: depositStatement.amount,
        description: depositStatement.description,
        type: depositStatement.type,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      user_id: user.id,
      description: depositStatement.description,
      amount: depositStatement.amount,
      type: "deposit",
    });
  });

  it("Should be able to create a withdraw statement", async () => {
    const withdrawStatement = {
      description: "Withdraw statement",
      type: "Withdraw" as OperationType,
      amount: 100,
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: withdrawStatement.amount,
        description: withdrawStatement.description,
        type: withdrawStatement.type,
      });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      user_id: user.id,
      description: withdrawStatement.description,
      amount: withdrawStatement.amount,
      type: "withdraw",
    });
  });
});
