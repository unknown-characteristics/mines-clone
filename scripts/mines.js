//return from [min, max)
export function random_int(min, max)
{
    if(min >= max) throw new Error("random_int: invalid arguments");
    let dif = max - min;
    return Math.floor(Math.random()*dif)+min;
}

export class mine_cell
{
    is_bomb;
    number;
    pos_row;
    pos_col;
    is_revealed;
    is_flagged;

    constructor(row, col)
    {
        this.pos_row = row;
        this.pos_col = col;
        this.is_bomb = this.is_revealed = this.is_flagged = false;
        this.number = 0;
    }
}

export class mines_game
{
    mine_count;
    col_num;
    row_num;
    uncovered_cells;
    game_state; //0 = not started, 1 = started, 2 = won, 3 = lost
    mine_matrix;

    constructor()
    {
        this.game_state = 0;
        this.uncovered_cells = 0;
    }

    new_game(rows, cols, mcnt, cell_type = mine_cell)
    {
        if(cols <= 0 || rows <= 0 || rows*cols < mcnt) throw new Error("new_game: invalid arguments");
        this.col_num = cols;
        this.row_num = rows;
        this.mine_count = mcnt;
        this.mine_matrix = [];
        for(let i = 0; i < this.row_num; i++)
        {
            this.mine_matrix[i] = [];
            for(let j = 0; j < this.col_num; j++)
                this.mine_matrix[i][j] = new cell_type(i, j);
        }
        this.game_state = 0;
        this.uncovered_cells = 0;
        return true;
    }

    get_neighbour_cells(cell)
    {
        let mine_row = cell.pos_row;
        let mine_col = cell.pos_col;
        //if(mine_row < 0 || mine_col < 0 || mine_row >= this.row_num || mine_col >= this.col_num) throw new Error("get_neighbour_cells: invalid arguments");
        let output = [];
        if(mine_row > 0)
        {
            output.push(this.mine_matrix[mine_row-1][mine_col]);
            if(mine_col > 0)
                output.push(this.mine_matrix[mine_row-1][mine_col-1]);
            if(mine_col < this.col_num - 1)
                output.push(this.mine_matrix[mine_row-1][mine_col+1]);
        }

        if(mine_col > 0)
            output.push(this.mine_matrix[mine_row][mine_col-1]);
        if(mine_col < this.col_num - 1)
            output.push(this.mine_matrix[mine_row][mine_col+1]);
        if(mine_row < this.row_num - 1)
        {
            output.push(this.mine_matrix[mine_row+1][mine_col]);
            if(mine_col > 0)
                output.push(this.mine_matrix[mine_row+1][mine_col-1]);
            if(mine_col < this.col_num - 1)
                output.push(this.mine_matrix[mine_row+1][mine_col+1]);
        }
        return output;
    }

    count_neighbour_flagged(cell)
    {
        let n_cells = this.get_neighbour_cells(cell);
        let flagged_count = 0;
        for(let n_cell of n_cells)
            if(n_cell.is_flagged)
                flagged_count++;
        return flagged_count;
    }

    init_random(click_row, click_col)
    {
        let mines_left = this.mine_count;
        while(mines_left)
        {
            let row = random_int(0, this.row_num);
            let col = random_int(0, this.col_num);
            if(this.mine_matrix[row][col].is_bomb || (row == click_row && col == click_col && this.row_num * this.col_num != this.mine_count)) continue;
            this.mine_matrix[row][col].is_bomb = true;
            mines_left--;
        }
        for(let i = 0; i < this.row_num; i++)
            for(let j = 0; j < this.col_num; j++)
            {
                let cell = this.mine_matrix[i][j];
                if(cell.is_bomb) continue;
                let neighbours = this.get_neighbour_cells(cell);
                let neighbour_mine_cnt = neighbours.filter((cell) => cell.is_bomb).length;
                cell.number = neighbour_mine_cnt;
            }
        this.game_state = 1;
    }

    //return: 0 = safe, 1 = exploded
    reveal_cell(cell, force = false)
    {
        let current_revealed_cells = [];
        if(cell.is_flagged) return {result: 0, revealed_cells: current_revealed_cells, bomb: null};

        if(cell.is_bomb)
        {
            this.game_state = 3;
            return {result: 1, revealed_cells: current_revealed_cells, bomb: cell};
        }

        if(cell.is_revealed && force)
        {
            
            if(cell.number == this.count_neighbour_flagged(cell))
            {
                const n_cells = this.get_neighbour_cells(cell);
                for(const n_cell of n_cells)
                {
                    if(n_cell.is_flagged) continue;
                    const result = this.reveal_cell(n_cell);
                    current_revealed_cells = current_revealed_cells.concat(result.revealed_cells);
                    if(result.result == 1)
                        return {result: 1, revealed_cells: current_revealed_cells, bomb: result.bomb};
                }
            }
        }
        else if(!cell.is_revealed)
        {
            cell.is_revealed = true;
            this.uncovered_cells++;
    
            current_revealed_cells.push(cell);
    
            if(cell.number == 0)
            {
                let n_cells = this.get_neighbour_cells(cell);
                for(let n_cell of n_cells)
                {
                    let result = this.reveal_cell(n_cell);
                    current_revealed_cells = current_revealed_cells.concat(result.revealed_cells);
                }
            }
        }
        if(this.uncovered_cells == this.row_num * this.col_num - this.mine_count)
            this.game_state = 2;
        return {result: 0, revealed_cells: current_revealed_cells, bomb: null};
    }
}
