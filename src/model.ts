import { match, __, not, select, when } from 'ts-pattern';
import { Option, Some, None, Result, Ok, Err } from 'ts-results';

export enum Color {
  Black = "BLACK",
  White = "WHITE"
}

function get_enemy_color(color: Color) {
  return (color == Color.White) ? Color.Black : Color.White;
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

  public get_row(): number {
    return this.row;
  }

  public get_col(): number {
    return this.col;
  }

  public equals(other: Position): boolean {
    return this.get_row() == other.get_row()
        && this.get_col() == other.get_col();
  }

  public to_string(): string {
    return "(" + this.row + ", " + this.col + ")";
  }
}

export class ChessPiece {
  private color: Color;
  private piece_type: PieceType;
  private moved: boolean;

  constructor(color: Color, piece_type: PieceType) {
    this.color = color;
    this.piece_type = piece_type;
    this.moved = false;
  }

  public get_color(): Color {
    return this.color;
  }

  public get_piece_type(): PieceType {
    return this.piece_type;
  }

  public get_moved(): boolean {
    return this.moved;
  }

  public set_moved(moved: boolean): void {
    this.moved = moved;
  }
}

export class ChessModel {
  private whose_turn: Color;
  private board: Option<ChessPiece>[][];

  constructor() {
    this.whose_turn = Color.White;
    this.randomize_whose_turn();

    this.board = this.empty_board();
    this.place_pieces(Color.Black);
    this.place_pieces(Color.White);
  }

  public get_whose_turn(): Color {
    return this.whose_turn;
  }

  private randomize_whose_turn(): void {
    this.whose_turn = [Color.White, Color.Black][
      Math.floor(Math.random() * 2)
    ];
  }

  private end_turn(): void {
    this.whose_turn = get_enemy_color(this.whose_turn);
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

  public get_moves_at(pos: Position): Result<Position[], string> {
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    if (cell_result.err) {
      return Err(cell_result.val as string);
    } else {
      let cell: Option<ChessPiece> = cell_result.unwrap();
      if (cell.none) {
        return Err("No piece found at " + pos.to_string());
      } else {
        let piece: ChessPiece = cell.unwrap();
        return Ok(this.possible_moves(pos, piece.get_piece_type()).unwrap());
      }
    }
  }

  public move_piece_at(pos: Position, dest: Position): Result<None, string> {
    let moves_result: Result<Position[], string> = this.get_moves_at(pos);
    if (moves_result.err) {
      return Err(moves_result.val as string);
    } else {
      let piece: ChessPiece = this.get_cell(pos).unwrap().unwrap();
      let moves: Position[] = moves_result.unwrap();
      if (moves.some((p) => p.equals(dest))) {
        this.board[dest.get_row()][dest.get_col()] = Some(piece);
        this.board[pos.get_row()][pos.get_col()] = None;
        piece.set_moved(true);
        return Ok(None)
      } else {
        return Err(
          "The piece at " + pos.to_string() + " can't be moved to "
          + "its destination at " + dest.to_string()
        );
      }
    }
  }

  private possible_moves(
    pos: Position, piece_type: PieceType
  ): Result<Position[], string> {
    return match<PieceType>(piece_type)
      .with(PieceType.Pawn, () => this.all_pawn_moves(pos))
      .with(PieceType.Bishop, () => this.bishop_moves(pos))
      .with(PieceType.Knight, () => this.knight_moves(pos))
      .with(PieceType.Rook, () => this.all_rook_moves(pos))
      .with(PieceType.Queen, () => this.queen_moves(pos))
      .with(PieceType.King, () => this.king_moves(pos))
      .run();
  }

  private all_pawn_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves_result: Result<Position[], string> = this.pawn_moves(pos);
    return match<boolean>(moves_result.ok)
      .with(false, () => Err(moves_result.val as string))
      .with(
        true,
        () => Ok(
          moves_result.unwrap().concat(
            this.pawn_en_passant(pos).unwrap()
          ) 
        )
      )
      .run();
  }

  private pawn_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Pawn)
                  .with(false, () => Err("The given position was not a pawn."))
                  .with(
                    true,
                    () => {
                      // Can move one forward if it's empty.
                      let one_forward: Position = new Position(
                        pos.get_row() + match<Color>(piece.get_color())
                          .with(Color.White, () => -1)
                          .with(Color.Black, () => 1)
                          .run(),
                        pos.get_col()
                      );
                      let one_forward_result: Result<boolean, string>
                        = this.get_if_empty_cell(one_forward);
                      console.log(one_forward);
                      console.log(one_forward_result);
                      if (
                        one_forward_result.ok
                        && one_forward_result.unwrap()
                      ) {
                        moves.push(one_forward);
                      }

                      // Can move two forward if it's empty and haven't moved.
                      let two_forward: Position = new Position( 
                        pos.get_row() + match<Color>(piece.get_color())
                          .with(Color.White, () => -2)
                          .with(Color.Black, () => 2)
                          .run(),
                        pos.get_col()
                      );
                      let two_forward_result: Result<boolean, string>
                        = this.get_if_empty_cell(two_forward);
                      if (
                        two_forward_result.ok
                        && two_forward_result.unwrap()
                        && !piece.get_moved()
                      ) {
                        moves.push(two_forward);
                      }

                      // Can take a piece 1 space diagonally forward away.
                      let diagonal_left: Position;
                      let diagonal_right: Position;

                      // No pattern matching b/c tsserver doesn't like it here.
                      if (piece.get_color() == Color.White) {
                        diagonal_left = new Position(
                          pos.get_row() - 1,
                          pos.get_col() - 1
                        );
                        diagonal_right = new Position(
                          pos.get_row() - 1,
                          pos.get_col() + 1
                        );
                      } else {
                        diagonal_left = new Position(
                          pos.get_row() + 1,
                          pos.get_col() - 1
                        );
                        diagonal_right = new Position(
                          pos.get_row() + 1,
                          pos.get_col() + 1
                        );
                      }

                      let diagonal_left_takeable_result
                        : Result<boolean, string>
                        = this.get_if_takeable_piece(
                            piece.get_color(),
                            diagonal_left
                      );
  
                      let diagonal_right_takeable_result
                        : Result<boolean, string>
                        = this.get_if_takeable_piece(
                            piece.get_color(),
                            diagonal_right
                      );

                      if (
                        diagonal_left_takeable_result.ok
                        && diagonal_left_takeable_result.unwrap()
                      ) {
                        moves.push(diagonal_left);
                      }
                      if (
                        diagonal_right_takeable_result.ok
                        && diagonal_right_takeable_result.unwrap()
                      ) {
                        moves.push(diagonal_right);
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private pawn_en_passant(pos: Position): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Pawn)
                  .with(false, () => Err("The given position was not a pawn."))
                  .with(
                    true,
                    () => {
                      let en_passant_left: Position;
                      let en_passant_right: Position;

                      if (piece.get_color() == Color.White) {
                        en_passant_left = new Position(
                          pos.get_row() - 1,
                          pos.get_col() - 1
                        );
                        en_passant_right = new Position(
                          pos.get_row() - 1,
                          pos.get_col() + 1
                        );
                      } else {
                        en_passant_left = new Position(
                          pos.get_row() + 1,
                          pos.get_col() - 1
                        );
                        en_passant_right = new Position(
                          pos.get_row() + 1,
                          pos.get_col() + 1
                        );
                      }

                      let en_passant_enemy_left: Position = new Position(
                        pos.get_row(),
                        pos.get_col() - 1
                      );
                      let en_passant_enemy_right: Position = new Position(
                        pos.get_row(),
                        pos.get_col() + 1
                      );

                      let en_passant_takeable_left_result: Result<boolean, string>
                        = this.get_enemy_piece(
                          piece.get_color(), en_passant_enemy_left
                        );
                      let en_passant_takeable_right_result:
                        Result<boolean, string>
                        = this.get_enemy_piece(
                          piece.get_color(), en_passant_enemy_right
                        );

                      if (
                        en_passant_takeable_left_result.ok
                        && en_passant_takeable_left_result.unwrap()
                      ) {
                        moves.push(en_passant_left);
                      }
                      if (
                        en_passant_takeable_right_result.ok
                        && en_passant_takeable_right_result.unwrap()
                      ) {
                        moves.push(en_passant_right);
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private bishop_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Bishop)
                  .with(
                    false,
                    () => Err(
                      "The given position was not a bishop."
                    )
                  )
                  .with(
                    true,
                    () => {
                      for (let i: number = 0; i < 8; i++) {
                        let diagonals: Position[] = [
                          new Position(
                            pos.get_row() - i,
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row() - i,
                            pos.get_col() + i
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col() + i
                          )
                        ];

                        for (let j: number = 0; j < diagonals.length; j++) {
                          let empty_result: Result<boolean, string>
                            = this.get_if_empty_cell(diagonals[j]);
                          let takeable_result: Result<boolean, string>
                            = this.get_if_takeable_piece(
                              piece.get_color(),
                              diagonals[j]
                            );
                          if (
                            (empty_result.ok && empty_result.unwrap())
                            || (takeable_result.ok && takeable_result.unwrap())
                          ) {
                            moves.push(diagonals[j]);
                          }
                        }
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private knight_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Knight)
                  .with(
                    false,
                    () => Err(
                      "The given position was not a knight."
                    )
                  )
                  .with(
                    true,
                    () => {
                      let hops: Position[] = [
                        new Position(
                          pos.get_row() - 2,
                          pos.get_col() - 1
                        ),
                        new Position(
                          pos.get_row() - 2,
                          pos.get_col() + 1
                        ),
                        new Position(
                          pos.get_row() + 2,
                          pos.get_col() - 1
                        ),
                        new Position(
                          pos.get_row() + 2,
                          pos.get_col() + 1
                        ),
                        new Position(
                          pos.get_row() - 1,
                          pos.get_col() - 2
                        ),
                        new Position(
                          pos.get_row() + 1,
                          pos.get_col() - 2
                        ),
                        new Position(
                          pos.get_row() - 1,
                          pos.get_col() + 2
                        ),
                        new Position(
                          pos.get_row() + 1,
                          pos.get_col() + 2
                        )
                      ];

                      for (let j: number = 0; j < hops.length; j++) {
                        let empty_result: Result<boolean, string>
                          = this.get_if_empty_cell(hops[j]);
                        let takeable_result: Result<boolean, string>
                          = this.get_if_takeable_piece(
                            piece.get_color(),
                            hops[j]
                          );
                        if (
                          (empty_result.ok && empty_result.unwrap())
                          || (takeable_result.ok && takeable_result.unwrap())
                        ) {
                          moves.push(hops[j]);
                        }
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private all_rook_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves_result: Result<Position[], string> = this.rook_moves(pos);
    return match<boolean>(moves_result.ok)
      .with(false, () => Err(moves_result.val as string))
      .with(
        true,
        () => Ok(
          moves_result.unwrap().concat(
            this.rook_castling(pos).unwrap()
          )
        )
      )
      .run();
  }

  private rook_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Rook)
                  .with(
                    false,
                    () => Err(
                      "The given position was not a rook."
                    )
                  )
                  .with(
                    true,
                    () => {
                      for (let i: number = 0; i < 8; i++) {
                        let cardinals: Position[] = [
                          new Position(
                            pos.get_row() - i,
                            pos.get_col()
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col()
                          ),
                          new Position(
                            pos.get_row(),
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row(),
                            pos.get_col() + i
                          )
                        ];

                        for (let j: number = 0; j < cardinals.length; j++) {
                          let empty_result: Result<boolean, string>
                            = this.get_if_empty_cell(cardinals[j]);
                          let takeable_result: Result<boolean, string>
                            = this.get_if_takeable_piece(
                              piece.get_color(),
                              cardinals[j]
                            );
                          if (
                            (empty_result.ok && empty_result.unwrap())
                            || (takeable_result.ok && takeable_result.unwrap())
                          ) {
                            moves.push(cardinals[j]);
                          }
                        }
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private rook_castling(pos: Position): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Rook)
                  .with(false, () => Err("The given position was not a rook."))
                  .with(
                    true,
                    () => {
                      let en_passant_left: Position;
                      let en_passant_right: Position;

                      if (piece.get_color() == Color.White) {
                        en_passant_left = new Position(
                          pos.get_row() - 1,
                          pos.get_col() - 1
                        );
                        en_passant_right = new Position(
                          pos.get_row() - 1,
                          pos.get_col() + 1
                        );
                      } else {
                        en_passant_left = new Position(
                          pos.get_row() + 1,
                          pos.get_col() - 1
                        );
                        en_passant_right = new Position(
                          pos.get_row() + 1,
                          pos.get_col() + 1
                        );
                      }

                      let en_passant_enemy_left: Position = new Position(
                        pos.get_row(),
                        pos.get_col() - 1
                      );
                      let en_passant_enemy_right: Position = new Position(
                        pos.get_row(),
                        pos.get_col() + 1
                      );

                      let en_passant_takeable_left_result: Result<boolean, string>
                        = this.get_enemy_piece(
                          piece.get_color(), en_passant_enemy_left
                        );
                      let en_passant_takeable_right_result:
                        Result<boolean, string>
                        = this.get_enemy_piece(
                          piece.get_color(), en_passant_enemy_right
                        );

                      if (
                        en_passant_takeable_left_result.ok
                        && en_passant_takeable_left_result.unwrap()
                      ) {
                        moves.push(en_passant_left);
                      }
                      if (
                        en_passant_takeable_right_result.ok
                        && en_passant_takeable_right_result.unwrap()
                      ) {
                        moves.push(en_passant_right);
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  } 

  private queen_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.Queen)
                  .with(
                    false,
                    () => Err(
                      "The given position was not a queen."
                    )
                  )
                  .with(
                    true,
                    () => {
                      for (let i: number = 0; i < 8; i++) {
                        let all: Position[] = [
                          new Position(
                            pos.get_row() - i,
                            pos.get_col()
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col()
                          ),
                          new Position(
                            pos.get_row(),
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row(),
                            pos.get_col() + i
                          ),
                          new Position(
                            pos.get_row() - i,
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row() - i,
                            pos.get_col() + i
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col() - i
                          ),
                          new Position(
                            pos.get_row() + i,
                            pos.get_col() + i
                          )
                        ];

                        for (let j: number = 0; j < all.length; j++) {
                          let empty_result: Result<boolean, string>
                            = this.get_if_empty_cell(all[j]);
                          let takeable_result: Result<boolean, string>
                            = this.get_if_takeable_piece(
                              piece.get_color(),
                              all[j]
                            );
                          if (
                            (empty_result.ok && empty_result.unwrap())
                            || (takeable_result.ok && takeable_result.unwrap())
                          ) {
                            moves.push(all[j]);
                          }
                        }
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private king_moves(
    pos: Position
  ): Result<Position[], string> {
    let moves: Position[] = [];
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    match<boolean>(cell_result.ok)
      .with(false, () => Err(cell_result.val as string))
      .with(
        true,
        () => {
          let maybe_piece: Option<ChessPiece> = cell_result.unwrap();
          match<boolean>(maybe_piece.some)
            .with(false, () => Err("The given position was not a piece."))
            .with(
              true,
              () => {
                let piece: ChessPiece = maybe_piece.unwrap();
                match<boolean>(piece.get_piece_type() == PieceType.King)
                  .with(
                    false,
                    () => Err(
                      "The given position was not a king."
                    )
                  )
                  .with(
                    true,
                    () => {
                      let all: Position[] = [
                        new Position(
                          pos.get_row() - 1,
                          pos.get_col()
                        ),
                        new Position(
                          pos.get_row() - 1,
                          pos.get_col() - 1
                        ),
                        new Position(
                          pos.get_row() - 1,
                          pos.get_col() + 1
                        ),
                        new Position(
                          pos.get_row() + 1,
                          pos.get_col()
                        ),
                        new Position(
                          pos.get_row() + 1,
                          pos.get_col() - 1
                        ),
                        new Position(
                          pos.get_row() + 1,
                          pos.get_col() + 1
                        ),
                        new Position(
                          pos.get_row(),
                          pos.get_col() - 1
                        ),
                        new Position(
                          pos.get_row(),
                          pos.get_col() + 1
                        )
                      ];

                      for (let j: number = 0; j < all.length; j++) {
                        let empty_result: Result<boolean, string>
                          = this.get_if_empty_cell(all[j]);
                        let takeable_result: Result<boolean, string>
                          = this.get_if_takeable_piece(
                            piece.get_color(),
                            all[j]
                          );
                        if (
                          (empty_result.ok && empty_result.unwrap())
                          || (takeable_result.ok && takeable_result.unwrap())
                        ) {
                          moves.push(all[j]);
                        }
                      }
                    }
                  )
                  .run();
              }
            )
            .run();
        }
      )
      .run();
    return Ok(moves);
  }

  private invalid_pos(pos: Position): boolean {
    return pos.get_row() < 0 || pos.get_row() >= 8
        || pos.get_col() < 0 || pos.get_col() >= 8;
  }

  private get_cell(pos: Position): Result<Option<ChessPiece>, string> {
    if (this.invalid_pos(pos)) {
      return Err("The given position was an invalid position");
    } else {
      return Ok(this.board[pos.get_row()][pos.get_col()]);
    }
  }

  private get_if_empty_cell(pos: Position): Result<boolean, string> {
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    if (cell_result.err) {
      return cell_result;
    } else {
      return Ok(cell_result.val.none);
    }
  }

  private get_enemy_piece(
    color: Color, pos: Position
  ): Result<boolean, string> {
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    if (cell_result.err) {
      return cell_result;
    } else {
      let cell: Option<ChessPiece> = cell_result.val;
      if (cell.none) {
        return Ok(false);
      } else {
        return Ok(cell.unwrap().get_color() == get_enemy_color(color));
      }
    }
  }

  private get_if_takeable_piece(
    color: Color, pos: Position
  ): Result<boolean, string> {
    let cell_result: Result<Option<ChessPiece>, string> = this.get_cell(pos);
    if (cell_result.err) {
      return cell_result;
    } else {
      let cell: Option<ChessPiece> = cell_result.val;
      if (cell.none) {
        return Ok(false);
      } else {
        return Ok(
          (cell.unwrap().get_color() == get_enemy_color(color))
          && cell.unwrap().get_piece_type() != PieceType.King
        );
      }
    }
  }
}
