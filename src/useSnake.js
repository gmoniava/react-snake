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

function useSnake({ initialBoardWidth, initialBoardHeight }) {
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

  let newFoodCoordinates = (currentSnake) => {
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
    let newFood, gameOver;

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
      // Snake hit the wall, or maybe itself.
      gameOver = true;
      return { head: currentHead, gameOver, newFood };
    }

    if (newHead.x === food.x && newHead.y === food.y) {
      // If we get here, it means snake ate the food.
      newFood = newFoodCoordinates([newHead, ...snake]);
      newHead.key = uuidv4();
      return { head: [newHead, currentHead], gameOver, newFood };
    }

    return { head: newHead, gameOver, newFood };
  };

  let initialState = ({ x = 0, y = 0, length = 5 } = {}) => {
    let newSnake = createSnakeHorizontally(x, y, length);
    return {
      snake: newSnake,
      food: newFoodCoordinates(newSnake),
    };
  };

  const [gameState, dispatch] = React.useReducer(
    reducer,
    undefined,
    initialState
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

  let stopProcessingDirections = React.useCallback(() => {
    clearInterval(timerId.current);
  }, []);

  let startProcessingDirections = React.useCallback(() => {
    timerId.current = setInterval(() => {
      let currentDirection;
      if (!directionsRef.current.length) return;

      if (directionsRef.current.length > 1) {
        currentDirection = directionsRef.current.shift();
      } else {
        currentDirection = directionsRef.current[0];
      }

      dispatch({ type: "move", direction: currentDirection });
    }, 100);
  }, []);

  function reducer(state, action) {
    if (state.gameOver && action.type !== "reset") {
      return state;
    }

    if (action.type === "move") {
      let gameOver, newFood, head;
      let snake = state?.snake?.flatMap((cell, i) => {
        if (i === 0) {
          // We use this parenthesis for destructuring, since some variables below, were already declared
          ({ head, gameOver, newFood } = moveHead(
            action.direction,
            state.snake,
            state.food
          ));
          return head;
        } else {
          // If snake died, or ate food in this round, we don't move the rest of the body
          if (gameOver || newFood) {
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
        snake,
        food: newFood ? newFood : state.food,
        gameOver: gameOver,
      };
    } else if (action.type === "reset") {
      return initialState();
    }
    throw Error("Unknown action.", action);
  }

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyPress);
    return () => {
      document.removeEventListener("keydown", onKeyPress);
    };
  }, [onKeyPress]);

  React.useEffect(() => {
    if (gameState.gameOver) {
      // If game is over, no need to listen to key presses or to process them.
      stopProcessingDirections();
      document.removeEventListener("keydown", onKeyPress);
    }
  }, [gameState, stopProcessingDirections, onKeyPress]);

  React.useEffect(() => {
    startProcessingDirections();
    return () => {
      stopProcessingDirections();
    };
  }, [startProcessingDirections, stopProcessingDirections]);

  let reset = () => {
    stopProcessingDirections();
    startProcessingDirections();
    directionsRef.current = [];
    document.removeEventListener("keydown", onKeyPress);
    document.addEventListener("keydown", onKeyPress);
    dispatch({ type: "reset" });
  };

  return { gameState, reset };
}

export default useSnake;
