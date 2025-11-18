import request from "@/utils/request";

// 获取 Ollama 部署列表
export function getOllamaList(query) {
    return request({
        url: "/api/k8s/ollama/list",
        method: "get",
        params: query,
    });
}

// 部署 Ollama 到指定节点 / 命名空间
export function deployOllama(data) {
    return request({
        url: "/api/k8s/ollama/deploy",
        method: "post",
        data,
    });
}

// 拉取模型到指定 Ollama Pod
export function pullOllamaModel(data) {
    return request({
        url: "/api/k8s/ollama/model/pull",
        method: "post",
        data,
    });
}

// 获取 Ollama Pod 的模型列表
export function getOllamaModelList(query) {
    return request({
        url: "/api/k8s/ollama/model/list",
        method: "get",
        params: query,
    });
}

// 获取指定模型的详细信息
export function getOllamaModelDetail(query) {
    return request({
        url: "/api/k8s/ollama/model/detail",
        method: "get",
        params: query,
    });
}

// 调用指定模型进行聊天
export function chatWithOllama(data) {
    return request({
        url: "/api/k8s/ollama/chat",
        method: "post",
        data,
    });
}


