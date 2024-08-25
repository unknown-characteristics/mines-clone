import {mines_game, mine_cell, random_int} from "/scripts/mines.js" 

const global_game = new mines_game();

class visual_mine_cell
{
    base_cell;
    div_element;
    is_flagged;
}

let visual_mine_matrix;

function upgrade_cell_to_visual(cell)
{
    let i = cell.pos_row, j = cell.pos_col;
    return visual_mine_matrix[i][j];
}

function upgrade_cells_to_visual(cells)
{
    let output = [];
    for(const cell of cells)
        output.push(upgrade_cell_to_visual(cell))
    return output;
}

const body_element = document.body;
const form_element = document.getElementById("game_config_form");
const row_element = document.getElementById("row_input");
const col_element = document.getElementById("col_input");
const mine_element = document.getElementById("mine_input");
const submit_element = document.getElementById("game_start_button");
const game_board = document.getElementById("game_board")

const row_error = document.createElement("p");
row_error.appendChild(document.createTextNode(""));

const col_error = document.createElement("p");
col_error.appendChild(document.createTextNode(""));

const mine_error = document.createElement("p");
mine_error.appendChild(document.createTextNode(""));

function handle_submit(event)
{
    const row_cnt = row_element.valueAsNumber;
    const col_cnt = col_element.valueAsNumber;
    const mine_cnt = mine_element.valueAsNumber;
    
    let found_error = false;

    //handle invalid row arg
    if(row_cnt < 1 || row_cnt > 100)
    {
        if(!form_element.contains(row_error))
        {        
            row_error.textContent = `Invalid value (${row_cnt}), must be between 1 and 100`;
            const br_ref = row_element.nextElementSibling;
            row_error.style.display="inline";
            form_element.insertBefore(row_error, br_ref);
        }
        else
        {
            row_error.textContent = `Invalid value (${row_cnt}), must be between 1 and 100`;
        }
        found_error = true;
    }
    else
    {
        if(form_element.contains(row_error))
        {
            form_element.removeChild(row_error);
            row_error.textContent = '';
        }
    }

    //handle invalid col arg
    if(col_cnt < 1 || col_cnt > 100)
    {
        if(!form_element.contains(col_error))
        {        
            col_error.textContent = `Invalid value (${col_cnt}), must be between 1 and 100`;
            const br_ref = col_element.nextElementSibling;
            col_error.style.display="inline";
            form_element.insertBefore(col_error, br_ref);
        }
        else
        {
            col_error.textContent = `Invalid value (${col_cnt}), must be between 1 and 100`;
        }
        
        found_error = true;
    }
    else
    {
        if(form_element.contains(col_error))
        {
            form_element.removeChild(col_error);
            col_error.textContent = '';
        }
    }

    //handle invalid mine arg
    if((mine_cnt < 0 || mine_cnt > row_cnt*col_cnt) && !found_error)
    {
        if(!form_element.contains(mine_error))
        {        
            mine_error.textContent = `Invalid value (${mine_cnt}), must be between 0 and ${row_cnt*col_cnt}`;
            const br_ref = mine_element.nextElementSibling;
            mine_error.style.display="inline";
            form_element.insertBefore(mine_error, br_ref);
        }
        else
        {
            mine_error.textContent = `Invalid value (${mine_cnt}), must be between 0 and ${row_cnt*col_cnt}`;
        }
        found_error = true;
    }
    else
    {
        if(form_element.contains(mine_error))
        {
            form_element.removeChild(mine_error);
            mine_error.textContent = '';
        }
    }

    if(found_error) return;

    //initialize game
    body_element.style.animation = "";
    game_board.style.borderColor = "black";
    game_board.innerHTML = "";
    document.documentElement.style.setProperty("--column-count", `${col_cnt}`);
    document.documentElement.style.setProperty("--row-count", `${row_cnt}`);

    global_game.new_game(row_cnt, col_cnt, mine_cnt);
    let i, j;
    visual_mine_matrix = [];
    for(i = 0; i < row_cnt; i++)
    {
        visual_mine_matrix[i] = [];
        for(j = 0; j < col_cnt; j++)
        {
            visual_mine_matrix[i][j] = new visual_mine_cell();
            let cell_ref = visual_mine_matrix[i][j];

            cell_ref.base_cell = global_game.mine_matrix[i][j];

            cell_ref.div_element = document.createElement("div");
            cell_ref.div_element.className = "hidden";
            
            cell_ref.div_element.addEventListener("mouseup", (event)=>handle_mouseup_visual_cell(event, cell_ref))

            game_board.appendChild(cell_ref.div_element);
        }
    }
}


function handle_mouseup_visual_cell(event, cell)
{
    if(global_game.game_state > 1) return;


    if(event.button == 0)
    {
        if(global_game.game_state == 0)
            global_game.init_random(cell.base_cell.pos_row, cell.base_cell.pos_col);

        if(cell.base_cell.is_flagged) return;

        let reveal_result = global_game.reveal_cell(cell.base_cell, true);

        let revealed_cells = upgrade_cells_to_visual(reveal_result.revealed_cells);

        for(const vis_cell of revealed_cells)
        {
            vis_cell.div_element.className = "revealed";
            if(vis_cell.base_cell.number > 0)
            {
                const p_elem = document.createElement("p");
                
                const n_flags = global_game.count_neighbour_flagged(vis_cell.base_cell);
                const cell_num = vis_cell.base_cell.number - n_flags;
                p_elem.appendChild(document.createTextNode(`${cell_num}`));

                p_elem.style.color = get_color_from_number(vis_cell.base_cell.number);
                p_elem.style.opacity = cell_num == 0  ? "0.5" : "1";
                vis_cell.div_element.appendChild(p_elem);
            }
        }

        if(reveal_result.result == 1)
        {
            let vis_bomb = upgrade_cell_to_visual(reveal_result.bomb);
            vis_bomb.div_element.className = "exploded";
        }

        if(global_game.game_state == 2)
        {
            game_board.style.borderColor = "green";
            body_element.style.animation = "win 1.25s forwards";
        }
        if(global_game.game_state == 3)
        {
            game_board.style.borderColor = "red";
            body_element.style.animation = "lose 1.25s forwards";
        }

    }  
    else if(event.button == 2)
    {
        if(global_game.game_state != 1 || cell.base_cell.is_revealed) return;
        let dif;
        if(cell.base_cell.is_flagged)
        {
            cell.base_cell.is_flagged = false;
            cell.div_element.className = "hidden";
            dif = 1;
        }
        else if(!cell.base_cell.is_revealed)
        {
            cell.base_cell.is_flagged = true;
            cell.div_element.className = "flagged";
            dif = -1;
        }
        let n_cells = upgrade_cells_to_visual(global_game.get_neighbour_cells(cell.base_cell));
        for(const n_cell of n_cells)
        {
            if(!n_cell.base_cell.is_revealed || n_cell.base_cell.number == 0) continue;
            const p_elem = n_cell.div_element.children[0];

            let cell_num = Number(p_elem.textContent);
            cell_num += dif;
            p_elem.textContent = `${cell_num}`;
            p_elem.style.opacity = cell_num == 0  ? "0.5" : "1";
        }
    }
}

function get_color_from_number(number)
{
    if(number < 1 || number > 8) return "white";
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--color-${number}`);
    return color;
}

submit_element.addEventListener("click", handle_submit);
submit_element.click();

game_board.addEventListener("contextmenu", (event) =>
{
    event.preventDefault();
})
