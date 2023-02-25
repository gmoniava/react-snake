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
const GAME_STATUS = {
  USER_WON: "USER_WON",
  USER_LOST: "USER_LOST",
  GAME_STARTED: "GAME_STARTED",
  GAME_NOT_STARTED: "GAME_NOT_STARTED",
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

  // Creates snake. First element of the returned array is the snake head.
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

    for (let i = length - 1; i >= 0; i--) {
      snake.push({
        x: x + i,
        y: y,
        key: uuidv4(),
      });
    }
    return snake;
  };

  // Generates new food. If there is no space left to place the food, returns undefined.
  let createFood = (snake) => {
    if (snake.length === boardWidth * boardHeight) return;

    let randomFoodCoordinates = () => {
      let x = randomInt(0, boardWidth - 1);
      let y = randomInt(0, boardHeight - 1);

      return {
        x,
        y,
      };
    };

    let food = randomFoodCoordinates();

    while (isCollision(food, snake)) {
      food = randomFoodCoordinates();
    }

    return food;
  };

  let isCollision = (cell, otherCells) => {
    return !!otherCells.find((elem) => elem.x === cell.x && elem.y === cell.y);
  };

  let isValidMove = (newHead, snakeBody) => {
    let isCellOutsideBounds = (cell) => {
      return (
        cell.x >= boardWidth ||
        cell.y >= boardHeight ||
        cell.x < 0 ||
        cell.y < 0
      );
    };
    return (
      !isCellOutsideBounds(newHead) &&
      !isCollision(newHead, snakeBody.slice(1, snakeBody.length))
    );
  };

  function randomInt(minInclusinve, maxInclusive) {
    let ceilMin = Math.ceil(minInclusinve),
      floorMax = Math.floor(maxInclusive);
    return Math.floor(Math.random() * (floorMax - ceilMin + 1)) + ceilMin;
  }

  let createInitialState = ({
    x = initialSnakeX,
    y = initialSnakeY,
    length = initialLength,
  } = {}) => {
    let newSnake = createSnakeHorizontally(x, y, length);
    return {
      snake: newSnake,
      food: createFood(newSnake),
      gameStatus: GAME_STATUS.GAME_NOT_STARTED,
    };
  };

  let reducer = (state, action) => {
    if (
      state.gameStatus !== GAME_STATUS.GAME_STARTED &&
      action.type === "move"
    ) {
      return state;
    }

    // Moves the head of the snake to a given direction.
    let moveSnakeHead = (direction) => {
      let currentHead = state.snake[0];
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

      if (!isValidMove(newHead, state?.snake)) {
        return {
          gameStatus: GAME_STATUS.USER_LOST,
          head: currentHead,
          food: state?.food,
        };
      }

      if (newHead.x === state?.food.x && newHead.y === state?.food.y) {
        newHead.key = uuidv4();
        return {
          head: [newHead, currentHead],
          gameStatus:
            state?.snake.length === boardWidth * boardHeight - 1
              ? GAME_STATUS.USER_WON
              : state?.gameStatus,
          food: createFood([newHead, ...state?.snake]),
        };
      }

      return {
        head: newHead,
        food: state?.food,
        gameStatus: state?.gameStatus,
      };
    };

    if (action.type === "move") {
      let gameStatus, food;

      // Here we move the snake to some direction.
      let movedSnake = state?.snake?.flatMap((cell, i) => {
        if (i === 0) {
          let result = moveSnakeHead(action.payload);
          food = result.food;
          gameStatus = result.gameStatus;
          return result.head;
        } else {
          if (
            gameStatus === GAME_STATUS.USER_WON ||
            gameStatus === GAME_STATUS.USER_LOST ||
            food !== state.food
          ) {
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
        food,
        gameStatus,
      };
    } else if (action.type === "start") {
      return {
        ...createInitialState(action.payload),
        gameStatus: GAME_STATUS.GAME_STARTED,
      };
    }
    throw Error("Unknown action.", action);
  };

  const [gameState, dispatch] = React.useReducer(
    reducer,
    undefined,
    createInitialState
  );

  // Here we store user clicked directions
  // We use array because we process them one by one if user presses arrow keys too fast.
  let directionsRef = React.useRef([]);

  const timerId = React.useRef();

  let onKeyPress = React.useCallback((e) => {
    let userPressedDirection = keyCodesToDirections[e.keyCode];
    let currentDirection =
      directionsRef.current[directionsRef.current.length - 1];

    if (userPressedDirection === oppositeDirections[currentDirection]) {
      return;
    }

    if (
      [
        directions.RIGHT,
        directions.LEFT,
        directions.UP,
        directions.DOWN,
      ].indexOf(userPressedDirection) === -1
    ) {
      console.warn("Wrong directions");
      return;
    }

    directionsRef.current.push(userPressedDirection);
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
    // If user lost or won, we should stop listening for the key presses and also stop acting on the pressed keys
    if (
      gameState?.gameStatus === GAME_STATUS.USER_LOST ||
      gameState?.gameStatus === GAME_STATUS.USER_WON
    ) {
      stopProcessingPressedKeys();
      document.removeEventListener("keydown", onKeyPress);
    }
  }, [gameState?.gameStatus, stopProcessingPressedKeys, onKeyPress]);

  let startGame = (options) => {
    directionsRef.current = [];

    document.removeEventListener("keydown", onKeyPress);
    stopProcessingPressedKeys();

    document.addEventListener("keydown", onKeyPress);
    startProcessingPressedKeys();

    dispatch({ type: "start", payload: options });
  };

  return { gameState, startGame };
}

export default useSnake;
