import { match, __, not, select, when } from 'ts-pattern';
import { Option, Some, None } from 'ts-results';

export enum Color {
  Black = "BLACK",
  White = "WHITE"
}

export enum PieceType {
  Pawn = "PAWN",
  Bishop = "BISHOP",
  Knight = "KNIGHT",
  Rook = "ROOK",
  Queen = "QUEEN",
  King = "KING"
}

export class Position {
  private row: number;
  private col: number;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  public get_row() {
    return this.row;
  }

  public get_col() {
    return this.col;
  }
}

export class ChessPiece {
  private color: Color;
  private piece_type: PieceType;

  constructor(color: Color, piece_type: PieceType) {
    this.color = color;
    this.piece_type = piece_type;
  }

  public get_color(): Color {
    return this.color;
  }

  public get_piece_type(): PieceType {
    return this.piece_type;
  }
}

export class ChessModel {
  private board: Option<ChessPiece>[][];

  constructor() {
    this.board = this.empty_board();
    this.place_pieces(Color.Black);
    this.place_pieces(Color.White);
  }

  public get_board(): Option<ChessPiece>[][] {
    return this.board;
  }

  private empty_board(): Option<ChessPiece>[][] {
    let board: Option<ChessPiece>[][] = [];
    for (let i: number = 0; i < 8; i++) {
      let row: Option<ChessPiece>[] = []
      for (let j: number = 0; j < 8; j++) {
        row.push(None);
      }
      board.push(row);
    }
    return board;
  }

  private place_pieces(color: Color): void {
    let home: number = (color == Color.Black) ? 0 : 7;
    for (let i: number = 0; i < 4; i++) {
      match<number>(i)
        .with(
          0, () => {
            this.board[home][i] = this.board[home][7 - i] = Some(
              new ChessPiece(color, PieceType.Rook)
            );
          }
        )
        .with(
          1, () => {
            this.board[home][i] = this.board[home][7 - i] = Some(
              new ChessPiece(color, PieceType.Knight)
            );
          }
        )
        .with(
          2, () => {
            this.board[home][i] = this.board[home][7 - i] = Some(
              new ChessPiece(color, PieceType.Bishop)
            );
          }
        )
        .with(
          3, () => {
            this.board[home][i] = Some(
              new ChessPiece(color, PieceType.Queen)
            );
            this.board[home][7 - i] = Some(
              new ChessPiece(color, PieceType.King)
            );
          }
        )
        .run();
    }
    for (let i: number = 0; i < 8; i++) {
      this.board[(color == Color.Black) ? home + 1 : home - 1][i] = Some(
        new ChessPiece(color, PieceType.Pawn)
      );
    }
  }

  public get_moves_at(pos: Position): Position[] {
    let moves: Position[] = [];

    return moves;
  }

  private get_possible_moves(
    pos: Position, piece_type: PieceType
  ): Position[] {
    let possible: Position[] = [];

    return possible;
  }
}
