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
let receiverUser: User;
let senderUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    receiverUser = await usersRepository.create({
      email: "test@receiver.com",
      name: "User test",
      password: await hash("test", 8),
    });

    senderUser = await usersRepository.create({
      email: "test@sender.com",
      name: "User test 2",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ senderUser }, secret, {
      subject: senderUser.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get user balance", async () => {
    const statementsRepository = new StatementsRepository();

    const statement1 = await statementsRepository.create({
      amount: 200,
      description: "Test statement",
      type: "deposit" as OperationType,
      user_id: senderUser.id,
    });

    const statement2 = await statementsRepository.create({
      amount: 400,
      description: "Test statement 2",
      type: "deposit" as OperationType,
      user_id: senderUser.id,
    });

    const statement3 = await statementsRepository.create({
      amount: 100,
      description: "Test statement 3",
      type: "withdraw" as OperationType,
      user_id: senderUser.id,
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect.arrayContaining([statement1, statement2, statement3]);
  });

  it("Should not be able to get balance if user does not exist", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const fakeUserId = uuidv4().toString();
    const fakeToken = sign({}, secret, {
      subject: fakeUserId,
      expiresIn,
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found",
    });
  });
});
