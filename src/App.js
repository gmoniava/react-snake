import React from "react";
import useSnake from "./useSnake";

// Classic snake game

export default function Snake({
  cellWidth = 25,
  initialBoardWidth = 20,
  initialBoardHeight = 20,
}) {
  let { gameState, reset } = useSnake({
    initialBoardWidth: initialBoardWidth,
    initialBoardHeight: initialBoardHeight,
  });

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: initialBoardWidth * cellWidth,
          width: initialBoardHeight * cellWidth,
          border: "1px solid gray",
        }}
      >
        {gameState?.snake?.map((x) => {
          return (
            <div
              key={x.key}
              style={{
                position: "absolute",
                top: x.y * cellWidth,
                left: x.x * cellWidth,
                background: "gray",
                height: cellWidth,
                width: cellWidth,
              }}
            ></div>
          );
        })}
        {gameState.food && (
          <div
            style={{
              position: "absolute",
              top: gameState.food.y * cellWidth,
              left: gameState.food.x * cellWidth,
              background: "green",
              height: cellWidth,
              width: cellWidth,
            }}
          ></div>
        )}
      </div>
      <button
        style={{ marginTop: 10 }}
        onClick={() => {
          reset();
        }}
      >
        Reset
      </button>
    </div>
  );
}
