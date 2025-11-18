<template>
  <div class="ollama">
    <el-row>
      <!-- 头部1：命名空间 + 刷新 -->
      <el-col :span="24">
        <div>
          <el-card class="ollama-head-card" shadow="never" :body-style="{ padding: '10px' }">
            <el-row>
              <el-col :span="6">
                <div>
                  <span>命名空间: </span>
                  <el-select v-model="namespaceValue" filterable placeholder="请选择">
                    <el-option
                      v-for="(item, index) in namespaceList"
                      :key="index"
                      :label="item.metadata.name"
                      :value="item.metadata.name"
                    />
                  </el-select>
                </div>
              </el-col>
              <el-col :span="2" :offset="16">
                <div>
                  <el-button style="border-radius: 2px" icon="Refresh" plain @click="getOllamaDeployList">
                    刷新
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-col>

      <!-- 头部2：创建 + 搜索（预留） -->
      <el-col :span="24">
        <div>
          <el-card class="ollama-head-card" shadow="never" :body-style="{ padding: '10px' }">
            <el-row>
              <el-col :span="2">
                <div>
                  <el-button
                    style="border-radius: 2px"
                    icon="Edit"
                    type="primary"
                    @click="openDeployDialog"
                    v-loading.fullscreen.lock="fullscreenLoading"
                  >
                    部署 Ollama
                  </el-button>
                </div>
              </el-col>
              <el-col :span="6">
                <div>
                  <el-input
                    class="ollama-head-search"
                    clearable
                    placeholder="按名称搜索（预留）"
                    v-model="searchInput"
                  />
                  <el-button
                    style="border-radius: 2px"
                    icon="Search"
                    type="primary"
                    plain
                    @click="getOllamaDeployList"
                  >
                    搜索
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-col>

      <!-- 部署列表 -->
      <el-col :span="24">
        <div>
          <el-card class="ollama-body-card" shadow="never" :body-style="{ padding: '5px' }">
            <el-table
              style="width: 100%; font-size: 12px; margin-bottom: 10px"
              :data="ollamaList"
              v-loading="appLoading"
            >
              <el-table-column width="20" />
              <el-table-column align="left" label="名称">
                <template #default="scope">
                  <span class="ollama-body-name">{{ scope.row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" label="命名空间" prop="namespace" />
              <el-table-column align="center" label="类型" prop="type" />
              <el-table-column align="center" label="镜像">
                <template #default="scope">
                  <el-popover
                    placement="right"
                    :width="260"
                    trigger="hover"
                    :content="scope.row.image"
                  >
                    <template #reference>
                      <el-tag>{{ ellipsis(scope.row.image) }}</el-tag>
                    </template>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column align="center" label="端口" prop="port" />
              <el-table-column align="center" label="节点选择器">
                <template #default="scope">
                  <span v-if="scope.row.node_selector">{{ scope.row.node_selector }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column align="center" label="状态">
                <template #default="scope">
                  <el-tag
                    :type="scope.row.status === 'Ready' ? 'success' : scope.row.status === 'Pending' ? 'warning' : 'info'"
                  >
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column align="center" label="Pod 就绪">
                <template #default="scope">
                  <span>{{ scope.row.ready_pods }} / {{ scope.row.pods }}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" label="操作" width="320">
                <template #default="scope">
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="Box"
                    type="primary"
                    plain
                    @click="openModelDialog(scope.row)"
                  >
                    模型管理
                  </el-button>
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="ChatDotRound"
                    type="success"
                    plain
                    @click="openChatDialog(scope.row)"
                  >
                    聊天
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="ollama-body-pagination"
              background
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="pagesizeList"
              :page-size="pagesize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="ollamaTotal"
            />
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 部署 Ollama 弹窗 -->
    <el-dialog title="部署 Ollama" v-model="deployDialogVisible" width="40%">
      <el-form
        ref="deployFormRef"
        :model="deployForm"
        :rules="deployFormRules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="deployForm.name" placeholder="如：ollama-test" />
        </el-form-item>
        <el-form-item label="命名空间" prop="namespace">
          <el-select v-model="deployForm.namespace" filterable placeholder="请选择">
            <el-option
              v-for="(item, index) in namespaceList"
              :key="index"
              :label="item.metadata.name"
              :value="item.metadata.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="镜像" prop="image">
          <el-input v-model="deployForm.image" placeholder="默认：ollama/ollama:latest" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model.number="deployForm.port" placeholder="默认：11434" />
        </el-form-item>
        <el-form-item label="部署类型" prop="deploy_type">
          <el-select v-model="deployForm.deploy_type">
            <el-option label="Deployment" value="deployment" />
            <el-option label="StatefulSet" value="statefulset" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU" prop="cpu">
          <el-select v-model="deployForm.cpu" placeholder="如：2">
            <el-option label="0.5" value="0.5" />
            <el-option label="1" value="1" />
            <el-option label="2" value="2" />
            <el-option label="4" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="内存" prop="memory">
          <el-select v-model="deployForm.memory" placeholder="如：4Gi">
            <el-option label="2Gi" value="2Gi" />
            <el-option label="4Gi" value="4Gi" />
            <el-option label="8Gi" value="8Gi" />
            <el-option label="16Gi" value="16Gi" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储大小" prop="storage_size">
          <el-select v-model="deployForm.storage_size" placeholder="如：20Gi">
            <el-option label="10Gi" value="10Gi" />
            <el-option label="20Gi" value="20Gi" />
            <el-option label="50Gi" value="50Gi" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deployDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitDeploy">立即部署</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模型管理弹窗 -->
    <el-dialog
      title="模型管理"
      v-model="modelDialogVisible"
      width="60%"
      top="5%"
    >
      <el-row :gutter="10">
        <el-col :span="8">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-model-section-title">目标 Pod</div>
            <el-form label-width="90px" :model="modelQuery">
              <el-form-item label="命名空间">
                <el-input v-model="modelQuery.namespace" disabled />
              </el-form-item>
              <el-form-item label="Pod 名称">
                <el-input
                  v-model="modelQuery.pod_name"
                  placeholder="请输入 Ollama Pod 名称"
                />
              </el-form-item>
            </el-form>
            <div class="ollama-model-section-title" style="margin-top: 10px">拉取模型</div>
            <el-form label-width="90px" :model="pullForm">
              <el-form-item label="模型标识">
                <el-input
                  v-model="pullForm.model_name"
                  placeholder="如：tinyllama、qwen2:7b 等"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  style="border-radius: 2px"
                  :loading="pullingModel"
                  @click="handlePullModel"
                >
                  拉取
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-model-header">
              <span>模型列表</span>
              <el-button
                type="primary"
                plain
                size="small"
                icon="Refresh"
                @click="loadModelList"
              >
                刷新列表
              </el-button>
            </div>
            <el-table
              :data="modelList"
              v-loading="modelListLoading"
              style="width: 100%; font-size: 12px; margin-top: 10px"
            >
              <el-table-column type="index" width="50" />
              <el-table-column label="名称" prop="name" />
              <el-table-column label="家族" width="90">
                <template #default="scope">
                  <span>{{ scope.row.details?.family || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="参数规模" width="100">
                <template #default="scope">
                  <span>{{ scope.row.details?.parameter_size || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="大小" width="120">
                <template #default="scope">
                  <span>{{ formatSize(scope.row.size) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="180">
                <template #default="scope">
                  <span>{{ timeTrans(scope.row.modified_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160">
                <template #default="scope">
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    type="primary"
                    plain
                    @click="viewModelDetail(scope.row)"
                  >
                    详情
                  </el-button>
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    type="success"
                    plain
                    @click="openChatDialogWithModel(scope.row)"
                  >
                    聊天
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- 模型详情弹窗 -->
    <el-dialog
      title="模型详情"
      v-model="modelDetailDialogVisible"
      width="60%"
      top="5%"
    >
      <el-row :gutter="10">
        <el-col :span="12">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-model-section-title">基础信息</div>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="家族">
                {{ modelDetail.details?.family || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="参数规模">
                {{ modelDetail.details?.parameter_size || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="量化等级">
                {{ modelDetail.details?.quantization_level || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="能力">
                <span v-for="item in modelDetail.capabilities" :key="item">
                  <el-tag size="small" style="margin-right: 4px">{{ item }}</el-tag>
                </span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-model-section-title">系统提示词</div>
            <el-scrollbar height="200px">
              <pre class="ollama-pre">{{ modelDetail.system }}</pre>
            </el-scrollbar>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="10" style="margin-top: 10px">
        <el-col :span="24">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-model-section-title">Modelfile</div>
            <el-scrollbar height="260px">
              <pre class="ollama-pre">{{ modelDetail.modelfile }}</pre>
            </el-scrollbar>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- 聊天弹窗 -->
    <el-dialog
      title="Ollama Chat"
      v-model="chatDialogVisible"
      width="60%"
      top="5%"
    >
      <el-form :inline="true" :model="chatForm" label-width="80px">
        <el-form-item label="Pod 名称">
          <el-input
            v-model="chatForm.pod_name"
            placeholder="请输入 Ollama Pod 名称"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="chatForm.namespace" disabled style="width: 160px" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input
            v-model="chatForm.model"
            placeholder="如：tinyllama"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <el-row :gutter="10">
        <el-col :span="24">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="ollama-chat-window" id="ollama-chat-window">
              <div
                v-for="(msg, index) in chatMessages"
                :key="index"
                :class="['ollama-chat-message', msg.role]"
              >
                <div class="ollama-chat-role">
                  {{ msg.role === 'user' ? '我' : 'Ollama' }}
                </div>
                <div class="ollama-chat-content">
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="10" style="margin-top: 10px">
        <el-col :span="24">
          <el-input
            type="textarea"
            v-model="chatInput"
            :rows="3"
            placeholder="请输入要发送给模型的问题"
          />
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chatDialogVisible = false">关 闭</el-button>
          <el-button type="primary" :loading="chatLoading" @click="sendChat">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getNamespecelist } from "@/api/namespace";
import {
  getOllamaList,
  deployOllama,
  pullOllamaModel,
  getOllamaModelList,
  getOllamaModelDetail,
  chatWithOllama,
} from "@/api/ollama";

export default {
  name: "Ollama",
  data() {
    return {
      // 命名空间
      namespaceValue: "default",
      namespaceList: [],

      // 列表
      appLoading: false,
      ollamaList: [],
      ollamaTotal: 0,
      currentPage: 1,
      pagesize: 10,
      pagesizeList: [10, 20, 30],
      searchInput: "",

      // 创建 / 部署
      fullscreenLoading: false,
      deployDialogVisible: false,
      deployForm: {
        name: "",
        namespace: "",
        image: "ollama/ollama:latest",
        port: 11434,
        deploy_type: "deployment",
        cpu: "2",
        memory: "4Gi",
        storage_size: "20Gi",
      },
      deployFormRules: {
        name: [{ required: true, message: "请填写名称", trigger: "change" }],
        namespace: [{ required: true, message: "请选择命名空间", trigger: "change" }],
        image: [{ required: true, message: "请填写镜像", trigger: "change" }],
        port: [{ required: true, message: "请填写端口", trigger: "change" }],
        deploy_type: [{ required: true, message: "请选择部署类型", trigger: "change" }],
        cpu: [{ required: true, message: "请选择 CPU", trigger: "change" }],
        memory: [{ required: true, message: "请选择内存", trigger: "change" }],
        storage_size: [{ required: true, message: "请选择存储大小", trigger: "change" }],
      },

      // 模型管理
      modelDialogVisible: false,
      modelQuery: {
        namespace: "",
        pod_name: "",
      },
      modelListLoading: false,
      modelList: [],
      pullingModel: false,
      pullForm: {
        model_name: "",
      },
      currentOllamaDeploy: null,

      // 模型详情
      modelDetailDialogVisible: false,
      modelDetail: {
        capabilities: [],
        details: {},
        modelfile: "",
        system: "",
      },

      // 聊天
      chatDialogVisible: false,
      chatForm: {
        pod_name: "",
        namespace: "",
        model: "",
      },
      chatMessages: [],
      chatInput: "",
      chatLoading: false,
    };
  },
  methods: {
    ellipsis(value) {
      if (!value) {
        return "-";
      }
      return value.length > 20 ? value.substring(0, 20) + "..." : value;
    },
    timeTrans(timestamp) {
      if (!timestamp) return "-";
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return timestamp;
      }
      return date.toISOString().replace("T", " ").substring(0, 19);
    },
    formatSize(size) {
      if (!size && size !== 0) return "-";
      const num = Number(size);
      if (Number.isNaN(num)) return size;
      if (num < 1024 * 1024) {
        return num + " B";
      }
      if (num < 1024 * 1024 * 1024) {
        return (num / 1024 / 1024).toFixed(2) + " MB";
      }
      return (num / 1024 / 1024 / 1024).toFixed(2) + " GB";
    },
    handleSizeChange(size) {
      this.pagesize = size;
      this.getOllamaDeployList();
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.getOllamaDeployList();
    },
    getNamespaces() {
      getNamespecelist()
        .then((res) => {
          this.namespaceList = res.data.items;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg,
          });
        });
    },
    getOllamaDeployList() {
      this.appLoading = true;
      const params = {
        namespace: this.namespaceValue,
        page: this.currentPage,
        limit: this.pagesize,
      };
      getOllamaList(params)
        .then((res) => {
          this.ollamaList = res.data.items || [];
          this.ollamaTotal = res.data.total || 0;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg,
          });
        })
        .finally(() => {
          this.appLoading = false;
        });
    },
    openDeployDialog() {
      this.deployForm.namespace = this.namespaceValue;
      this.deployDialogVisible = true;
    },
    submitDeploy() {
      this.$refs.deployFormRef.validate((valid) => {
        if (!valid) {
          return;
        }
        this.fullscreenLoading = true;
        const payload = {
          ...this.deployForm,
          port: Number(this.deployForm.port),
        };
        deployOllama(payload)
          .then((res) => {
            this.$message.success({
              message: res.msg || "部署任务已提交",
            });
            this.deployDialogVisible = false;
            this.getOllamaDeployList();
          })
          .catch((res) => {
            this.$message.error({
              message: res.msg || "部署失败",
            });
          })
          .finally(() => {
            this.fullscreenLoading = false;
          });
      });
    },
    openModelDialog(row) {
      this.currentOllamaDeploy = row;
      this.modelQuery.namespace = row.namespace || this.namespaceValue;
      this.modelQuery.pod_name = "";
      this.pullForm.model_name = "";
      this.modelList = [];
      this.modelDialogVisible = true;
    },
    loadModelList() {
      if (!this.modelQuery.pod_name) {
        this.$message.warning({
          message: "请先填写 Pod 名称",
        });
        return;
      }
      this.modelListLoading = true;
      getOllamaModelList(this.modelQuery)
        .then((res) => {
          this.modelList = res.data.models || [];
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取模型列表失败",
          });
        })
        .finally(() => {
          this.modelListLoading = false;
        });
    },
    handlePullModel() {
      if (!this.modelQuery.pod_name) {
        this.$message.warning({
          message: "请先填写 Pod 名称",
        });
        return;
      }
      if (!this.pullForm.model_name) {
        this.$message.warning({
          message: "请填写要拉取的模型标识",
        });
        return;
      }
      this.pullingModel = true;
      const payload = {
        pod_name: this.modelQuery.pod_name,
        namespace: this.modelQuery.namespace,
        model_name: this.pullForm.model_name,
      };
      pullOllamaModel(payload)
        .then((res) => {
          this.$message.success({
            message: res.msg || "拉取模型成功",
          });
          this.loadModelList();
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "拉取模型失败",
          });
        })
        .finally(() => {
          this.pullingModel = false;
        });
    },
    viewModelDetail(row) {
      if (!this.modelQuery.pod_name) {
        this.$message.warning({
          message: "请先填写 Pod 名称",
        });
        return;
      }
      const params = {
        pod_name: this.modelQuery.pod_name,
        namespace: this.modelQuery.namespace,
        model_name: row.name || row.model,
      };
      getOllamaModelDetail(params)
        .then((res) => {
          this.modelDetail = res.data || {};
          this.modelDetailDialogVisible = true;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取模型详情失败",
          });
        });
    },
    openChatDialog(row) {
      this.chatForm.namespace = row.namespace || this.namespaceValue;
      this.chatForm.pod_name = "";
      this.chatForm.model = "";
      this.chatMessages = [];
      this.chatInput = "";
      this.chatDialogVisible = true;
    },
    openChatDialogWithModel(row) {
      // 使用当前模型名预填聊天模型
      if (!this.currentOllamaDeploy) {
        return;
      }
      this.chatForm.namespace =
        this.modelQuery.namespace || this.currentOllamaDeploy.namespace || this.namespaceValue;
      this.chatForm.pod_name = this.modelQuery.pod_name || "";
      this.chatForm.model = row.name || row.model;
      this.chatMessages = [];
      this.chatInput = "";
      this.chatDialogVisible = true;
    },
    scrollChatToBottom() {
      this.$nextTick(() => {
        const el = document.getElementById("ollama-chat-window");
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
    sendChat() {
      if (!this.chatForm.pod_name) {
        this.$message.warning({
          message: "请先填写 Pod 名称",
        });
        return;
      }
      if (!this.chatForm.model) {
        this.$message.warning({
          message: "请先填写模型名称",
        });
        return;
      }
      if (!this.chatInput) {
        this.$message.warning({
          message: "请输入要发送的内容",
        });
        return;
      }
      const userMsg = {
        role: "user",
        content: this.chatInput,
      };
      this.chatMessages.push(userMsg);
      const payload = {
        pod_name: this.chatForm.pod_name,
        namespace: this.chatForm.namespace,
        model: this.chatForm.model,
        messages: this.chatMessages,
        stream: false,
      };
      this.chatLoading = true;
      this.chatInput = "";
      this.scrollChatToBottom();
      chatWithOllama(payload)
        .then((res) => {
          const data = res.data || {};
          if (data.message && data.message.content) {
            this.chatMessages.push({
              role: "assistant",
              content: data.message.content,
            });
          }
          this.scrollChatToBottom();
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "调用模型失败",
          });
        })
        .finally(() => {
          this.chatLoading = false;
        });
    },
  },
  watch: {
    namespaceValue: {
      handler() {
        localStorage.setItem("namespace", this.namespaceValue);
        this.currentPage = 1;
        this.getOllamaDeployList();
      },
    },
  },
  beforeMount() {
    if (
      localStorage.getItem("namespace") !== undefined &&
      localStorage.getItem("namespace") !== null
    ) {
      this.namespaceValue = localStorage.getItem("namespace");
    }
    this.getNamespaces();
    this.getOllamaDeployList();
  },
};
</script>

<style scoped>
.ollama-head-card,
.ollama-body-card {
  border-radius: 1px;
  margin-bottom: 5px;
}

.ollama-head-search {
  width: 200px;
  margin-right: 10px;
}

.ollama-body-name {
  color: #4795ee;
}

.ollama-body-name:hover {
  color: rgb(84, 138, 238);
  cursor: pointer;
  font-weight: bold;
}

.ollama-body-pagination {
  margin-top: 5px;
  text-align: right;
}

.ollama-model-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.ollama-model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
}

.ollama-pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
}

.ollama-chat-window {
  height: 320px;
  overflow-y: auto;
  padding: 8px;
  background-color: #f7f8fa;
}

.ollama-chat-message {
  margin-bottom: 10px;
}

.ollama-chat-message .ollama-chat-role {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.ollama-chat-message .ollama-chat-content {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
}

.ollama-chat-message.user .ollama-chat-content {
  background-color: #e6f7ff;
}

.ollama-chat-message.assistant .ollama-chat-content {
  background-color: #fff;
}
</style>


