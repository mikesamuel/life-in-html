{
    let $ = document.querySelector.bind(document);
    let board = $('#board');
    let playButton = $('#play');
    let colorsForm = $('#colors-form');

    let n = 10;
    let cells = [];

    let cellsTable = document.createElement('table');
    let cellsBody = document.createElement('tbody');
    board.appendChild(cellsTable);
    cellsTable.appendChild(cellsBody);

    // Build table of cells
    for (let j = 0; j < n; ++j) {
        let tr = document.createElement('tr');
        let cellsRow = [];
        cells.push(cellsRow);
        cellsRow.tr = tr;
        cellsBody.appendChild(tr);
        for (let i = 0; i < n; ++i) {
            let td = document.createElement('td');
            td.classList.add('cell');
            td.classList.add('off');
            td.setAttribute('data-color', 'blu');
            td.id = `cell_${i}_${j}`;
            tr.appendChild(td);
            cellsRow.push(td);
            td.addEventListener('click', clickHandler(td, i, j));
        }
    }

    function isCellOn(i, j) {
        let cell = cells[j]?.[i];
        return !!(cell && cell?.classList?.contains('on'));
    }

    let colorPicked = colorsForm.color.value;
    colorsForm.color.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                colorPicked = colorsForm.color.value
            }
        });
    });

    function mixColors(
        { red = 0, orn = 0, yel = 0, grn = 0, blu = 0, pur = 0 },
    ) {
        let ranked = [
            ['red', red], ['orn', orn], ['yel', yel],
            ['grn', grn], ['blu', blu], ['pur', pur],
        ];
        ranked.sort((a, b) => b[1] - a[1] || (a[0] < a[1] ? -1 : a[0] == a[1] ? 0 : 1));
        // If there is one dominant color, pick it.
        let [ultimateColor, ultimateCount] = ranked[0];
        let [penultimateColor, penultimateCount] = ranked[1];
        if (ultimateCount && ultimateCount > penultimateCount * 2) {
            return ultimateColor;
        }
        // If there are two colors that mix well, mix them.
        let [thirdColor, thirdCount] = ranked[2];
        if (penultimateCount > thirdCount) {
            let toMix = [ultimateColor, penultimateColor];
            toMix.sort();
            let twoColorNames=`${toMix[0]}${toMix[1]}`;
            switch (twoColorNames) {
            case 'ornred': case 'redyel': case 'ornyel': return 'orn';
            case 'bluyel': case 'blugrn': case 'grnyel': return 'grn';
            case 'blupur': case 'purred': case 'blured': return 'pur';
            }
        }
        if (ultimateCount) { return ultimateColor; }
        // Otherwise default to the color picker color.
        return colorPicked;
    }

    function setCell(i, j, on, colorCode = colorPicked) {
        let cell = cells[j][i];
        if (on) {
            cell.className = `cell on`;
            checkAdj(i, j);
        } else {
            cell.className = `cell off`;
        }
        if (colorPicked) {
            cell.setAttribute('data-color', colorCode);
        }
        checkAdj(i - 1, j);
        checkAdj(i + 1, j);
        checkAdj(i, j - 1);
        checkAdj(i, j + 1);
    }

    function checkAdj(i, j) {
        let cell = cells[j]?.[i];
        if (!cell?.classList?.contains('on')) { return }
        let left = cells[j]?.[i - 1]?.classList?.contains('on');
        let right = cells[j]?.[i + 1]?.classList?.contains('on');
        let up = cells[j - 1]?.[i]?.classList?.contains('on');
        let down = cells[j + 1]?.[i]?.classList?.contains('on');
        let adj = (up ? 1 : 0) |
            (left ? 2 : 0) |
            (down ? 4 : 0) |
            (right ? 8 : 0);
        cell.setAttribute('data-adj', `${adj}`);
    }

    function clickHandler(cell, i, j) {
        return function (event) {
            setCell(i, j, !isCellOn(i, j));
        };
    }

    playButton.addEventListener('click', togglePlaying);

    let playing = playButton.classList.contains('on');

    function togglePlaying() {
        playButton.classList.toggle('on');
        playing = playButton.classList.contains('on');
    }

    setInterval(updateGameBoard, 250 /* ms */);

    function updateGameBoard() {
        if (!playing) { return }

        // Get the cells as true/false values.
        let cellStates = cells.map(
            (row) => row.map(
                (cell) => [cell.classList.contains('on'), cell.getAttribute('data-color')],
            )
        );

        // Fill in new cell states using rules from old cell states.
        for (let y = 0; y < n; ++y) {
            for (let x = 0; x < n; ++x) {
                let self = cellStates[y][x];
                let liveNeighbors = [
                    cellStates[y - 1]?.[x - 1], // nw
                    cellStates[y - 1]?.[x    ], // n
                    cellStates[y - 1]?.[x + 1], // ne
                    cellStates[y    ]?.[x - 1], // w
                    cellStates[y    ]?.[x + 1], // e
                    cellStates[y + 1]?.[x - 1], // sw
                    cellStates[y + 1]?.[x    ], // s
                    cellStates[y + 1]?.[x + 1], // se
                ].filter(x => x?.[0]);

                let numLiveNeighbors = liveNeighbors.length;

                let isAlive;
                let color;
                if (self[0]) {
                    // If the cell is alive, then it stays alive
                    // if it has either 2 or 3 live neighbors.
                    isAlive = 2 <= numLiveNeighbors && numLiveNeighbors <= 3;
                    color = self[1];
                } else {
                    // If the cell is dead, then it springs to life
                    // only in the case that it has 3 live neighbors.
                    isAlive = numLiveNeighbors === 3;
                    if (isAlive) {
                        let colors = { };
                        for (let [, neighborColor] of liveNeighbors) {
                            colors[neighborColor] = (colors[neighborColor] || 0) + 1;
                        }
                        color = mixColors(colors);
                    }
                }

                setCell(x, y, isAlive, color);
            }
        }
    }
}
