import React from "react";
import { v4 as uuidv4 } from "uuid";

let directions = {
  LEFT: "Left",
  UP: "Up",
  RIGHT: "Right",
  DOWN: "Down",
};
let keyCodesToDirections = {
  37: directions.LEFT,
  38: directions.UP,
  39: directions.RIGHT,
  40: directions.DOWN,
};
let oppositeDirections = {
  [directions.LEFT]: directions.RIGHT,
  [directions.RIGHT]: directions.LEFT,
  [directions.UP]: directions.DOWN,
  [directions.DOWN]: directions.UP,
};

function useSnake({
  initialBoardWidth,
  initialBoardHeight,
  initialSnakeX = 0,
  initialSnakeY = 0,
  initialLength = 5,
}) {
  let [boardWidth] = React.useState(initialBoardWidth);
  let [boardHeight] = React.useState(initialBoardHeight);

  let createSnakeHorizontally = (x, y, length) => {
    if (
      length < 1 ||
      x < 0 ||
      y < 0 ||
      y >= boardHeight ||
      x + length > boardWidth
    )
      throw new Error("Wrong coordinates or snake length");

    let snake = [];

    // In our model, the first element in the array should be head.
    // Hence, we insert the head first, which in this case is right most cell of the snake.
    for (let i = length - 1; i >= 0; i--) {
      snake.push({
        x: x + i,
        y: y,
        key: uuidv4(),
      });
    }
    return snake;
  };

  let createFood = (currentSnake) => {
    if (currentSnake.length === boardWidth * boardHeight) return;

    let randomFoodCoordinates = () => {
      let x = randomInt(0, boardWidth - 1);
      let y = randomInt(0, boardHeight - 1);

      return {
        x,
        y,
      };
    };

    let food = randomFoodCoordinates();

    while (isCollision(food, currentSnake)) {
      food = randomFoodCoordinates();
    }

    return food;
  };

  let isCollision = (cell, otherCells) => {
    return !!otherCells.find((elem) => elem.x === cell.x && elem.y === cell.y);
  };

  let isValidMove = (snakeHead, snakeBody) => {
    let isCellOutsideBounds = (cell) => {
      return (
        cell.x >= boardWidth ||
        cell.y >= boardHeight ||
        cell.x < 0 ||
        cell.y < 0
      );
    };
    return (
      !isCellOutsideBounds(snakeHead) &&
      !isCollision(snakeHead, snakeBody.slice(1, snakeBody.length))
    );
  };

  function randomInt(minInclusinve, maxInclusive) {
    let ceilMin = Math.ceil(minInclusinve),
      floorMax = Math.floor(maxInclusive);
    return Math.floor(Math.random() * (floorMax - ceilMin + 1)) + ceilMin;
  }

  let moveHead = (direction, snake, food) => {
    let currentHead = snake[0];
    let newHead = {
      ...currentHead,
    };

    switch (direction) {
      case directions.RIGHT:
        newHead.x++;
        break;
      case directions.LEFT:
        newHead.x--;
        break;
      case directions.UP:
        newHead.y--;
        break;
      case directions.DOWN:
        newHead.y++;
        break;
      default:
        throw Error("Unknown direction.", direction);
    }

    if (!isValidMove(newHead, snake)) {
      return { head: currentHead, gameFinished: "USER_LOST" };
    }

    if (newHead.x === food.x && newHead.y === food.y) {
      newHead.key = uuidv4();
      return {
        head: [newHead, currentHead],
        gameFinished:
          snake.length === boardWidth * boardHeight - 1
            ? "USER_WON"
            : undefined,
        newFood: createFood([newHead, ...snake]),
      };
    }

    return { head: newHead };
  };

  let createInitialState = ({
    x = initialSnakeX,
    y = initialSnakeY,
    length = initialLength,
  } = {}) => {
    let newSnake = createSnakeHorizontally(x, y, length);
    return {
      snake: newSnake,
      food: createFood(newSnake),
    };
  };

  let reducer = (state, action) => {
    if (state.gameFinished && action.type !== "reset") {
      return state;
    }

    if (action.type === "move") {
      let gameFinished, newFood;
      let movedSnake = state?.snake?.flatMap((cell, i) => {
        if (i === 0) {
          let result = moveHead(action.payload, state.snake, state.food);
          newFood = result.newFood;
          gameFinished = result.gameFinished;
          return result.head;
        } else {
          if (gameFinished || newFood) {
            return cell;
          }
          return {
            ...cell,
            x: state.snake[i - 1].x,
            y: state.snake[i - 1].y,
          };
        }
      });

      return {
        snake: movedSnake,
        food: newFood
          ? newFood
          : gameFinished === "USER_WON"
          ? undefined
          : state.food,
        gameFinished: gameFinished,
      };
    } else if (action.type === "reset") {
      return createInitialState(action.payload);
    }
    throw Error("Unknown action.", action);
  };

  const [gameState, dispatch] = React.useReducer(
    reducer,
    undefined,
    createInitialState
  );

  let directionsRef = React.useRef([]);
  const timerId = React.useRef();

  let onKeyPress = React.useCallback((e) => {
    let newDirection = keyCodesToDirections[e.keyCode];
    let currentDirection =
      directionsRef.current[directionsRef.current.length - 1];

    if (newDirection === oppositeDirections[currentDirection]) {
      return;
    }

    if (
      [
        directions.RIGHT,
        directions.LEFT,
        directions.UP,
        directions.DOWN,
      ].indexOf(newDirection) === -1
    ) {
      console.warn("Wrong directions");
      return;
    }

    directionsRef.current.push(newDirection);
  }, []);

  let stopProcessingPressedKeys = React.useCallback(() => {
    clearInterval(timerId.current);
  }, []);

  let startProcessingPressedKeys = React.useCallback(() => {
    timerId.current = setInterval(() => {
      let currentDirection;
      if (!directionsRef.current.length) return;

      if (directionsRef.current.length > 1) {
        currentDirection = directionsRef.current.shift();
      } else {
        currentDirection = directionsRef.current[0];
      }

      dispatch({ type: "move", payload: currentDirection });
    }, 100);
  }, []);

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyPress);
    return () => {
      document.removeEventListener("keydown", onKeyPress);
    };
  }, [onKeyPress]);

  React.useEffect(() => {
    if (gameState.gameFinished) {
      stopProcessingPressedKeys();
      document.removeEventListener("keydown", onKeyPress);
    }
  }, [gameState, stopProcessingPressedKeys, onKeyPress]);

  React.useEffect(() => {
    startProcessingPressedKeys();
    return () => {
      stopProcessingPressedKeys();
    };
  }, [startProcessingPressedKeys, stopProcessingPressedKeys]);

  let reset = (options) => {
    stopProcessingPressedKeys();
    startProcessingPressedKeys();
    directionsRef.current = [];
    document.removeEventListener("keydown", onKeyPress);
    document.addEventListener("keydown", onKeyPress);
    dispatch({ type: "reset", payload: options });
  };

  return { gameState, reset };
}

export default useSnake;
