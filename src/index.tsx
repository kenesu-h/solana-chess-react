import { Option, Some, None } from "ts-results";
import { Color, PieceType, ChessPiece, ChessModel } from "./model";

let model: ChessModel = new ChessModel();

for (let i: number = 0; i < 8; i++) {
  for (let j: number = 0; j < 8; j++) {
    console.log(model.get_board()[i][j]);
  }
}
