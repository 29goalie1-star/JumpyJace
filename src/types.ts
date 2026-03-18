export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
  color: string;
}

export interface Player extends Entity {
  isGrounded: boolean;
  jumpForce: number;
  speed: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  camera: Vector;
  isGameOver: boolean;
  score: number;
  highScore: number;
}
