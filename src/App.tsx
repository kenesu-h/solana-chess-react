import React, { useEffect, useState } from "react";
import "./App.css";

import { match, __ } from "ts-pattern";
import { Option, Some, None, Result, Ok, Err } from "ts-results";
import { Position, Color, PieceType, ChessPiece, ChessModel } from "./model";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import IconDefinition from "@fortawesome/fontawesome-svg-core";
import {
  faChessPawn,
  faChessBishop,
  faChessKnight,
  faChessRook,
  faChessQueen,
  faChessKing
} from "@fortawesome/free-solid-svg-icons";

const App = () => {
  // let model: ChessModel = new ChessModel();

  let [selected, setSelected] = useState(None as Option<Position>);
  let [model, setModel] = useState(new ChessModel());

  function pieceTypeToIcon(
    piece_type: PieceType
  ): IconDefinition.IconDefinition {
    return match<PieceType>(piece_type)
      .with(PieceType.Pawn, () => faChessPawn)
      .with(PieceType.Bishop, () => faChessBishop)
      .with(PieceType.Knight, () => faChessKnight)
      .with(PieceType.Rook, () => faChessRook)
      .with(PieceType.Queen, () => faChessQueen)
      .with(PieceType.King, () => faChessKing)
      .run();
  }

  function colorToClassName(color: Color): string {
    return "chess-piece " + match<Color>(color)
      .with(Color.White, () => "chess-piece-white")
      .with(Color.Black, () => "chess-piece-black")
      .run();
  }

  function renderPiece(piece: ChessPiece): JSX.Element {
    return (
      <FontAwesomeIcon 
        className={colorToClassName(piece.get_color())}
        icon={pieceTypeToIcon(piece.get_piece_type())}
      />
    );
  }

  function positionToClassName(is_piece: boolean, position: Position): string {
    if (is_piece) {
      return match<boolean>(selected.some)
        .with(false, () => "")
        .with(true, () => {
          if (position.equals(selected.unwrap())) {
            return "cell-selected";
          } else {
            return "";
          }
        })
        .run();
    } else {
      return "";
    }
  }

  function renderCell(
    maybe_piece: Option<ChessPiece>, row: number, col: number
  ): JSX.Element {
    let position: Position = new Position(row, col);
    return (
      <td
        className={positionToClassName(maybe_piece.some, position)}
        onClick={() => setSelected(Some(position))}
      >
        {
          maybe_piece.some && renderPiece(maybe_piece.unwrap())
        }
      </td>
    );
  }

  function renderSelectableCell(
    moves: Position[], maybe_piece: Option<ChessPiece>, row: number, col: number
  ): JSX.Element {
    let position: Position = new Position(row, col);
    return (
      <td
        className="cell-selectable"
        onClick={
          () => {
            console.log(model.move_piece_at(selected.unwrap(), position));
            setSelected(None);
            setModel(model);
          }
        }
      >
        {
          maybe_piece.some && renderPiece(maybe_piece.unwrap())
        }
      </td>
    );
  }

  function renderCells(
    cells: Option<ChessPiece>[], row: number
  ): JSX.Element[] {
    let rendered: JSX.Element[] = [];
    if (selected.none) {
      for (let j: number = 0; j < 8; j++) {
        rendered.push(renderCell(cells[j], row, j));
      }
    } else {
      let moves_result: Result<Position[], string>
        = model.get_moves_at(selected.unwrap());
      if (moves_result.err) {
        for (let j: number = 0; j < 8; j++) {
          rendered.push(renderCell(cells[j], row, j));
        }
      } else {
        let moves: Position[] = moves_result.unwrap();
        for (let j: number = 0; j < 8; j++) {
          if (moves.some((p) => p.equals(new Position(row, j)))) {
            rendered.push(renderSelectableCell(moves, cells[j], row, j));
          } else {
            rendered.push(renderCell(cells[j], row, j));
          }
        }
      }
    }
    return rendered;
  }

  function renderRow(
    cells: Option<ChessPiece>[], row: number
  ): JSX.Element {
    return (
      <tr>
        {renderCells(cells, row)}
      </tr>
    );
  }

  function renderRows(board: Option<ChessPiece>[][]): JSX.Element[] {
    let rendered: JSX.Element[] = [];
    for (let i: number = 0; i < 8; i++) {
      rendered.push(renderRow(board[i], i));
    }
    return rendered;
  }

  function renderModel(): JSX.Element {
    return (
      <table className="chess-board">
        {renderRows(model.get_board())}
      </table>
    );
  }

  function render(): JSX.Element {
    return (
      <div className="App">
        {renderModel()}
      </div>
    );
  }

  return render();
}

export default App;
