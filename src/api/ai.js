import request from "@/utils/request";

// 结合知识库进行聊天
export function chatWithKnowledgeBase(data) {
    return request({
        url: "/api/ai/chat_with_kb",
        method: "post",
        data,
    });
}


