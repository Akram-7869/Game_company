const ChatManager = {

    initialize() {
        this.messageList = document.getElementById('messageList');
        // Initialize history with dummy data
        this.initializeHistory();
    },

    initializeHistory() {
        
    },

    chatMessage(msg) {

        let msgde = this.decompressMessage(msg.message);
        let newMessage = document.createElement('li');

        newMessage.innerHTML = `
    <div class="conversation-list">
      <div class="ctext-wrap">>
          <h5 class="font-size-14 conversation-name"><a href="#" class="text-dark">${msg.firstName}</a> 
            <span class="d-inline-block font-size-12 text-muted ms-2"></span>
            </h5>
          <p class="mb-0">${msgde}</p>
        </div>
      </div>
        <div class="ctext-wrap-content"
    </div>
  `;
        this.messageList.appendChild(newMessage);
        window.scrollTo(0, document.body.scrollHeight);  // Scroll to the bottom
    }, compressMessage(message) {
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);
        const compressedBytes = pako.gzip(messageBytes);
        return btoa(String.fromCharCode(...compressedBytes));
    }, decompressMessage(compressedMessage) {
        const compressedBytes = Uint8Array.from(atob(compressedMessage), c => c.charCodeAt(0));
        const decompressedBytes = pako.ungzip(compressedBytes);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(decompressedBytes);
    }, displayEmoji(emojiData) {
        const emojiElement = document.createElement('li');
        const emojiImg = document.createElement('img');
        emojiImg.src = `/public/gameshtml/emojis/${emojiData.emojiIndex}.png`;
        emojiImg.width = 30;
        emojiImg.height = 30;
        emojiElement.textContent = `${emojiData.firstName}: `;
        emojiElement.appendChild(emojiImg);
        this.messageList.appendChild(emojiElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
        // // Create flying emoji
        // const flyingEmoji = document.createElement('img');
        // flyingEmoji.src = `/public/gameshtml/emojis/${emojiData.emojiIndex}.png`;
        // flyingEmoji.className = 'flying-emoji';
        // flyingEmoji.style.width = '60px';
        // flyingEmoji.style.height = '60px';
        // flyingEmoji.style.left = Math.random() * (window.innerWidth - 60) + 'px';
        // flyingEmoji.style.top = window.innerHeight + 'px';
        // document.body.appendChild(flyingEmoji);

        // setTimeout(() => {
        //     flyingEmoji.style.top = '-60px';
        //     flyingEmoji.style.opacity = '0';
        // }, 100);

        // setTimeout(() => {
        //     document.body.removeChild(flyingEmoji);
        // }, 2100);
    }, displayGift(emojiData) {
        const emojiElement = document.createElement('li');
        const emojiImg = document.createElement('img');
        emojiImg.src = `/public/gameshtml/gifts/gift_${emojiData.giftIndex}.png`;
        emojiImg.width = 30;
        emojiImg.height = 30;
        emojiElement.textContent = `${emojiData.firstName}: `;
        emojiElement.appendChild(emojiImg);
        this.messageList.appendChild(emojiElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
        // Create flying emoji
        const flyingEmoji = document.createElement('img');
        flyingEmoji.src = `/public/gameshtml/gifts/gift_${emojiData.giftIndex}.png`;
        flyingEmoji.className = 'flying-emoji';
        flyingEmoji.style.width = '60px';
        flyingEmoji.style.height = '60px';
        flyingEmoji.style.left = Math.random() * (window.innerWidth - 60) + 'px';
        flyingEmoji.style.top = window.innerHeight + 'px';
        document.body.appendChild(flyingEmoji);

        setTimeout(() => {
            flyingEmoji.style.top = '-60px';
            flyingEmoji.style.opacity = '0';
        }, 100);

        setTimeout(() => {
            document.body.removeChild(flyingEmoji);
        }, 2100);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChatManager.initialize();
});

window.ChatManager = ChatManager;

