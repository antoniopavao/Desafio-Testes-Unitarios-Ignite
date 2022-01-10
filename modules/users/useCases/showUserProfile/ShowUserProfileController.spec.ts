import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import request from "supertest";
import authConfig from "../../../../config/auth";

import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

import { UsersRepository } from "@modules/users/repositories/UsersRepository";
import { app } from "../../../../app";

let connection: Connection;

describe("Show User Profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to show user's profile", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      name: "User Test",
      email: "user@example.com",
      password: await hash("12345", 8),
    });
    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });

    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
  });
});
