import React from "react";
import useSnake from "./useSnake";

// Classic snake game

export default function Snake({
  cellWidth = 25,
  initialBoardWidth = 10,
  initialBoardHeight = 10,
}) {
  let { gameState, startGame } = useSnake({
    initialBoardWidth: initialBoardWidth,
    initialBoardHeight: initialBoardHeight,
    initialLength: 6,
  });

  React.useEffect(() => {
    startGame();
  }, []); // eslint-disable-line

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: initialBoardHeight * cellWidth,
          width: initialBoardWidth * cellWidth,
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
          startGame();
        }}
      >
        Reset
      </button>
    </div>
  );
}
