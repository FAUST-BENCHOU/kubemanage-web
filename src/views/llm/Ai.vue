<template>
  <div class="ai">
    <el-row>
      <!-- 参数表单 -->
      <el-col :span="24">
        <el-card class="ai-head-card" shadow="never" :body-style="{ padding: '15px' }">
          <div class="ai-title">知识库 + Ollama 联合对话</div>
          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            label-width="140px"
            class="ai-form"
          >
            <el-row :gutter="10">
              <el-col :span="12">
                <div class="ai-section-title">知识库参数</div>
                <el-form-item label="知识库 Pod 名称" prop="knowledge_pod_name">
                  <el-input
                    v-model="form.knowledge_pod_name"
                    placeholder="如：knowledge-base-xxxx，实际运行中的知识库 Pod 名称"
                  />
                </el-form-item>
                <el-form-item label="知识库命名空间" prop="knowledge_namespace">
                  <el-input
                    v-model="form.knowledge_namespace"
                    placeholder="如：default"
                  />
                </el-form-item>
                <el-form-item label="知识库类型" prop="knowledge_type">
                  <el-input v-model="form.knowledge_type" disabled />
                </el-form-item>
                <el-form-item label="集合名称" prop="collection_name">
                  <el-input
                    v-model="form.collection_name"
                    placeholder="如：test_txt，与知识库中 collection_name 对应"
                  />
                </el-form-item>
                <el-form-item label="Top K">
                  <el-input
                    v-model.number="form.top_k"
                    placeholder="默认：5"
                    style="width: 120px"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <div class="ai-section-title">Ollama 参数</div>
                <el-form-item label="Ollama Pod 名称" prop="ollama_pod_name">
                  <el-input
                    v-model="form.ollama_pod_name"
                    placeholder="如：ollama-test-xxxx，实际运行中的 Ollama Pod 名称"
                  />
                </el-form-item>
                <el-form-item label="Ollama 命名空间" prop="ollama_namespace">
                  <el-input
                    v-model="form.ollama_namespace"
                    placeholder="如：default"
                  />
                </el-form-item>
                <el-form-item label="Ollama 模型" prop="ollama_model">
                  <el-input
                    v-model="form.ollama_model"
                    placeholder="如：tinyllama 或 tinyllama:latest"
                  />
                </el-form-item>
                <el-form-item label="流式输出">
                  <el-switch v-model="form.stream" disabled />
                  <span class="ai-tip">当前仅实现非流式，保留参数位</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <!-- 对话与相关文档 -->
      <el-col :span="24">
        <el-card class="ai-body-card" shadow="never" :body-style="{ padding: '15px' }">
          <el-row :gutter="10">
            <el-col :span="14">
              <div class="ai-section-title">对话</div>
              <div class="ai-chat-window" id="ai-chat-window">
                <div
                  v-for="(msg, index) in messages"
                  :key="index"
                  :class="['ai-chat-message', msg.role]"
                >
                  <div class="ai-chat-role">
                    {{ msg.role === 'user' ? '我' : 'AI' }}
                  </div>
                  <div class="ai-chat-content">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
              <div class="ai-chat-input">
                <el-input
                  type="textarea"
                  :rows="3"
                  v-model="question"
                  placeholder="请输入你的问题，系统会自动结合知识库相关文档回答"
                />
                <div class="ai-chat-actions">
                  <el-button
                    type="primary"
                    :loading="loading"
                    style="border-radius: 2px"
                    @click="handleAsk"
                  >
                    发送
                  </el-button>
                  <el-button
                    style="border-radius: 2px"
                    @click="clearChat"
                  >
                    清空对话
                  </el-button>
                </div>
              </div>
            </el-col>

            <el-col :span="10">
              <div class="ai-section-title">相关文档片段</div>
              <div class="ai-docs-window">
                <div
                  v-if="relatedDocuments && relatedDocuments.length > 0"
                >
                  <div
                    v-for="(doc, idx) in relatedDocuments"
                    :key="idx"
                    class="ai-doc-item"
                  >
                    <div class="ai-doc-index">片段 {{ idx + 1 }}</div>
                    <pre class="ai-doc-content">{{ doc }}</pre>
                  </div>
                </div>
                <div
                  v-else
                  class="ai-doc-empty"
                >
                  暂无相关文档，请先确保知识库中已上传文档且 collection_name 设置正确。
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { chatWithKnowledgeBase } from "@/api/ai";

export default {
  name: "AiManage",
  data() {
    return {
      form: {
        knowledge_pod_name: "",
        knowledge_namespace: "default",
        knowledge_type: "chromadb",
        collection_name: "",
        ollama_pod_name: "",
        ollama_namespace: "default",
        ollama_model: "",
        question: "",
        top_k: 5,
        stream: false,
      },
      rules: {
        knowledge_pod_name: [{ required: true, message: "请填写知识库 Pod 名称", trigger: "change" }],
        knowledge_namespace: [{ required: true, message: "请填写知识库命名空间", trigger: "change" }],
        collection_name: [{ required: true, message: "请填写集合名称", trigger: "change" }],
        ollama_pod_name: [{ required: true, message: "请填写 Ollama Pod 名称", trigger: "change" }],
        ollama_namespace: [{ required: true, message: "请填写 Ollama 命名空间", trigger: "change" }],
        ollama_model: [{ required: true, message: "请填写 Ollama 模型", trigger: "change" }],
      },
      messages: [],
      question: "",
      relatedDocuments: [],
      loading: false,
    };
  },
  methods: {
    scrollToBottom() {
      this.$nextTick(() => {
        const el = document.getElementById("ai-chat-window");
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
    clearChat() {
      this.messages = [];
      this.relatedDocuments = [];
      this.question = "";
    },
    handleAsk() {
      if (!this.question) {
        this.$message.warning({
          message: "请输入要提问的问题",
        });
        return;
      }
      this.$refs.formRef.validate((valid) => {
        if (!valid) {
          return;
        }
        const currentQuestion = this.question;
        // 先在 UI 中追加用户问题
        this.messages.push({
          role: "user",
          content: currentQuestion,
        });
        this.relatedDocuments = [];
        this.loading = true;
        this.form.question = currentQuestion;
        const payload = {
          knowledge_pod_name: this.form.knowledge_pod_name,
          knowledge_namespace: this.form.knowledge_namespace,
          knowledge_type: this.form.knowledge_type,
          collection_name: this.form.collection_name,
          ollama_pod_name: this.form.ollama_pod_name,
          ollama_namespace: this.form.ollama_namespace,
          ollama_model: this.form.ollama_model,
          question: this.form.question,
          top_k: this.form.top_k || 5,
          stream: this.form.stream,
        };
        this.question = "";
        this.scrollToBottom();
        chatWithKnowledgeBase(payload)
          .then((res) => {
            const data = res.data || {};
            // answer 部分
            if (data.answer && data.answer.message && data.answer.message.content) {
              this.messages.push({
                role: "assistant",
                content: data.answer.message.content,
              });
            }
            // 相关文档
            if (data.related_documents && Array.isArray(data.related_documents)) {
              this.relatedDocuments = data.related_documents;
            } else {
              this.relatedDocuments = [];
            }
            this.scrollToBottom();
          })
          .catch((res) => {
            this.$message.error({
              message: res.msg || "调用 AI 接口失败",
            });
          })
          .finally(() => {
            this.loading = false;
          });
      });
    },
  },
};
</script>

<style scoped>
.ai-head-card,
.ai-body-card {
  border-radius: 1px;
  margin-bottom: 5px;
}

.ai-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.ai-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.ai-form {
  margin-top: 5px;
}

.ai-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}

.ai-chat-window {
  height: 320px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  overflow-y: auto;
  background-color: #f7f8fa;
}

.ai-chat-message {
  margin-bottom: 10px;
}

.ai-chat-role {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.ai-chat-content {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
}

.ai-chat-message.user .ai-chat-content {
  background-color: #e6f7ff;
}

.ai-chat-message.assistant .ai-chat-content {
  background-color: #fff;
}

.ai-chat-input {
  margin-top: 10px;
}

.ai-chat-actions {
  margin-top: 6px;
  text-align: right;
}

.ai-docs-window {
  height: 380px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  overflow-y: auto;
  background-color: #fff;
}

.ai-doc-item {
  border-bottom: 1px dashed #e5e5e5;
  padding: 6px 0;
}

.ai-doc-index {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.ai-doc-content {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.ai-doc-empty {
  font-size: 12px;
  color: #999;
}
</style>
