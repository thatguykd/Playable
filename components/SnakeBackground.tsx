import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

const SnakeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const snakeRef = useRef<Point[]>([]);
  const foodRef = useRef<Point>({ x: 0, y: 0 });
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const moveCounterRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;

    // Define spawnFood before it's used
    const spawnFood = () => {
      const maxX = Math.floor(canvas.width / gridSize) - 1;
      const maxY = Math.floor(canvas.height / gridSize) - 1;

      foodRef.current = {
        x: Math.floor(Math.random() * maxX) * gridSize,
        y: Math.floor(Math.random() * maxY) * gridSize,
      };
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Initialize snake in center if not already initialized
      if (snakeRef.current.length === 0) {
        const centerX = Math.floor(canvas.width / 2 / gridSize) * gridSize;
        const centerY = Math.floor(canvas.height / 2 / gridSize) * gridSize;

        snakeRef.current = [
          { x: centerX, y: centerY },
          { x: centerX - gridSize, y: centerY },
          { x: centerX - gridSize * 2, y: centerY },
          { x: centerX - gridSize * 3, y: centerY },
        ];

        spawnFood();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getDistanceToFood = (point: Point): number => {
      const dx = foodRef.current.x - point.x;
      const dy = foodRef.current.y - point.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const chooseDirection = () => {
      const head = snakeRef.current[0];
      const possibleDirections = [
        { x: 1, y: 0 },   // right
        { x: -1, y: 0 },  // left
        { x: 0, y: 1 },   // down
        { x: 0, y: -1 },  // up
      ];

      // Filter out opposite direction to prevent instant collision
      const validDirections = possibleDirections.filter(dir => {
        return !(dir.x === -directionRef.current.x && dir.y === -directionRef.current.y);
      });

      // Calculate which direction moves closer to food
      const directionsWithScore = validDirections.map(dir => {
        const nextPos = {
          x: head.x + dir.x * gridSize,
          y: head.y + dir.y * gridSize
        };

        // Wrap around screen edges
        if (nextPos.x < 0) nextPos.x = Math.floor(canvas.width / gridSize) * gridSize - gridSize;
        if (nextPos.x >= canvas.width) nextPos.x = 0;
        if (nextPos.y < 0) nextPos.y = Math.floor(canvas.height / gridSize) * gridSize - gridSize;
        if (nextPos.y >= canvas.height) nextPos.y = 0;

        const distance = getDistanceToFood(nextPos);

        return { dir, distance };
      });

      // Sort by distance (closer is better)
      directionsWithScore.sort((a, b) => a.distance - b.distance);

      // 70% chance to go towards food, 30% chance for random movement
      if (Math.random() < 0.7) {
        directionRef.current = directionsWithScore[0].dir;
      } else {
        directionRef.current = validDirections[Math.floor(Math.random() * validDirections.length)];
      }
    };

    const moveSnake = () => {
      const head = snakeRef.current[0];
      const newHead = {
        x: head.x + directionRef.current.x * gridSize,
        y: head.y + directionRef.current.y * gridSize,
      };

      // Wrap around screen edges
      if (newHead.x < 0) newHead.x = Math.floor(canvas.width / gridSize) * gridSize - gridSize;
      if (newHead.x >= canvas.width) newHead.x = 0;
      if (newHead.y < 0) newHead.y = Math.floor(canvas.height / gridSize) * gridSize - gridSize;
      if (newHead.y >= canvas.height) newHead.y = 0;

      snakeRef.current.unshift(newHead);

      // Check if snake ate food
      if (Math.abs(newHead.x - foodRef.current.x) < gridSize &&
          Math.abs(newHead.y - foodRef.current.y) < gridSize) {
        spawnFood();
        // Keep the snake longer (don't remove tail)
      } else {
        snakeRef.current.pop();
      }

      // Limit snake length to prevent it getting too long
      if (snakeRef.current.length > 50) {
        snakeRef.current.pop();
      }
    };

    const drawGlow = (x: number, y: number, color: string, size: number) => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    };

    const draw = () => {
      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw snake with strong neon cyan/blue glow - VERY visible
      snakeRef.current.forEach((segment, index) => {
        const opacity = 1 - (index / snakeRef.current.length) * 0.3; // Very gradual fade

        // Draw outer glow (larger, more transparent)
        ctx.shadowBlur = 50;
        ctx.shadowColor = `rgba(34, 211, 238, ${opacity})`;
        ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 0.9})`; // 90% opacity
        ctx.fillRect(segment.x + 1, segment.y + 1, gridSize - 2, gridSize - 2);

        // Draw inner bright core
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(34, 211, 238, 1)';
        ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`; // Full opacity for head
        ctx.fillRect(segment.x + 3, segment.y + 3, gridSize - 6, gridSize - 6);
      });

      // Draw food with intense neon magenta/pink glow - VERY visible
      const foodX = foodRef.current.x + gridSize / 2;
      const foodY = foodRef.current.y + gridSize / 2;

      // Outer glow ring
      ctx.shadowBlur = 60;
      ctx.shadowColor = 'rgba(236, 72, 153, 1)';
      ctx.fillStyle = 'rgba(236, 72, 153, 0.8)';
      ctx.beginPath();
      ctx.arc(foodX, foodY, gridSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255, 105, 180, 1)'; // Hot pink glow
      ctx.fillStyle = 'rgba(255, 105, 180, 1)'; // Bright hot pink core
      ctx.beginPath();
      ctx.arc(foodX, foodY, gridSize / 3, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow for next frame
      ctx.shadowBlur = 0;
    };

    const gameLoop = () => {
      moveCounterRef.current++;

      // Move snake every 8 frames (slower, more graceful movement)
      if (moveCounterRef.current % 8 === 0) {
        chooseDirection();
        moveSnake();
      }

      draw();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.35 }}
    />
  );
};

export default SnakeBackground;
