import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/contract-generator";
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

export const connectToDatabase = async (): Promise<void> => {
	try {
		await mongoose.connect(MONGODB_URI, {
			auth: {
				username: MONGODB_USERNAME,
				password: MONGODB_PASSWORD,
			},
			authSource: "admin",
		});
		console.log("Conectado ao MongoDB com sucesso");
	} catch (error) {
		console.error("Erro ao conectar ao MongoDB:", error);
		process.exit(1);
	}
};
