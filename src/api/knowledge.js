import request from "@/utils/request";

// 获取知识库部署列表
export function getKnowledgeList(query) {
    return request({
        url: "/api/k8s/knowledge/list",
        method: "get",
        params: query,
    });
}

// 部署知识库
export function deployKnowledge(data) {
    return request({
        url: "/api/k8s/knowledge/deploy",
        method: "post",
        data,
    });
}

// 获取知识库详情
export function getKnowledgeDetail(query) {
    return request({
        url: "/api/k8s/knowledge/detail",
        method: "get",
        params: query,
    });
}

// 上传文档到知识库（form-data）
export function uploadKnowledgeDocument(formData) {
    return request({
        url: "/api/k8s/knowledge/document/upload",
        method: "post",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

// 查询知识库
export function queryKnowledge(data) {
    return request({
        url: "/api/k8s/knowledge/query",
        method: "post",
        data,
    });
}


