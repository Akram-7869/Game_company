// document.addEventListener('DOMContentLoaded', () => {
//     const currentPage = window.location.pathname.split('/').pop();
//     let gameType;

//     switch (currentPage) {
//         case 'index-dragontiger.html':
//             gameType = 'dragonTiger';
//             break;
//         case 'index-roulette.html':
//             gameType = 'roulette';
//             break;
//         case 'index-crash.html':
//             gameType = 'crash';
//             break;
//         default:
//             console.error('Unknown game type');
//             return;
//     }

//     initializeSocket(gameType);
// });

function updateRoomAndLobby(newRoomId, newLobbyId) {
    socketHandler.updateRoomAndLobby(newRoomId, newLobbyId);
}