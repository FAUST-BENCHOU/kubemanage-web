<template>
  <div class="knowledge">
    <el-row>
      <!-- 头部1：命名空间 + 刷新 -->
      <el-col :span="24">
        <div>
          <el-card class="knowledge-head-card" shadow="never" :body-style="{ padding: '10px' }">
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
                  <el-button style="border-radius: 2px" icon="Refresh" plain @click="getKnowledgeListFunc">
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
          <el-card class="knowledge-head-card" shadow="never" :body-style="{ padding: '10px' }">
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
                    部署知识库
                  </el-button>
                </div>
              </el-col>
              <el-col :span="6">
                <div>
                  <el-input
                    class="knowledge-head-search"
                    clearable
                    placeholder="按名称搜索（预留）"
                    v-model="searchInput"
                  />
                  <el-button
                    style="border-radius: 2px"
                    icon="Search"
                    type="primary"
                    plain
                    @click="getKnowledgeListFunc"
                  >
                    搜索
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-col>

      <!-- 知识库列表 -->
      <el-col :span="24">
        <div>
          <el-card class="knowledge-body-card" shadow="never" :body-style="{ padding: '5px' }">
            <el-table
              style="width: 100%; font-size: 12px; margin-bottom: 10px"
              :data="knowledgeList"
              v-loading="appLoading"
            >
              <el-table-column width="20" />
              <el-table-column align="left" label="名称">
                <template #default="scope">
                  <span class="knowledge-body-name">{{ scope.row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" prop="namespace" label="命名空间" />
              <el-table-column align="center" prop="type" label="类型" />
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
              <el-table-column align="center" prop="port" label="端口" />
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
              <el-table-column align="center" label="Ollama 绑定">
                <template #default="scope">
                  <div>
                    <span class="knowledge-ollama-tag">
                      Pod: {{ scope.row.ollama_pod_name || '-' }}
                    </span>
                  </div>
                  <div>
                    <span class="knowledge-ollama-tag">
                      Model: {{ scope.row.ollama_model || '-' }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column align="center" label="存储" width="120">
                <template #default="scope">
                  <span>{{ scope.row.storage_size || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" label="操作" width="320">
                <template #default="scope">
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    type="primary"
                    plain
                    @click="openDetailDialog(scope.row)"
                  >
                    详情
                  </el-button>
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    type="warning"
                    plain
                    @click="openUploadDialog(scope.row)"
                  >
                    上传文档
                  </el-button>
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    type="success"
                    plain
                    @click="openQueryDialog(scope.row)"
                  >
                    查询知识库
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="knowledge-body-pagination"
              background
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="pagesizeList"
              :page-size="pagesize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="knowledgeTotal"
            />
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 部署知识库弹窗 -->
    <el-dialog title="部署知识库" v-model="deployDialogVisible" width="45%">
      <el-form
        ref="deployFormRef"
        :model="deployForm"
        :rules="deployFormRules"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="deployForm.name" placeholder="如：knowledge-base" />
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
          <el-input v-model="deployForm.image" placeholder="默认：chromadb/chroma:latest" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model.number="deployForm.port" placeholder="默认：8000" />
        </el-form-item>
        <el-form-item label="部署类型" prop="deploy_type">
          <el-select v-model="deployForm.deploy_type">
            <el-option label="Deployment" value="deployment" />
            <el-option label="StatefulSet" value="statefulset" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储大小" prop="storage_size">
          <el-select v-model="deployForm.storage_size" placeholder="如：0.5Gi">
            <el-option label="0.5Gi" value="0.5Gi" />
            <el-option label="1Gi" value="1Gi" />
            <el-option label="5Gi" value="5Gi" />
          </el-select>
        </el-form-item>
        <el-form-item label="StorageClass">
          <el-input
            v-model="deployForm.storage_class"
            placeholder="可选：绑定 PVC 使用的存储类"
          />
        </el-form-item>
        <el-form-item label="Ollama Pod 名称" prop="ollama_pod_name">
          <el-input
            v-model="deployForm.ollama_pod_name"
            placeholder="如：ollama-test-xxxx，需与已有 Ollama 部署匹配"
          />
        </el-form-item>
        <el-form-item label="Ollama 模型" prop="ollama_model">
          <el-input
            v-model="deployForm.ollama_model"
            placeholder="如：tinyllama 或 tinyllama:latest"
          />
        </el-form-item>
        <el-form-item label="Ollama 命名空间" prop="ollama_namespace">
          <el-input v-model="deployForm.ollama_namespace" placeholder="默认：当前命名空间" />
        </el-form-item>
        <el-form-item label="节点选择器">
          <el-input
            type="textarea"
            :rows="2"
            v-model="deployForm.node_selector_str"
            placeholder='可选，JSON 格式，如 {"disktype":"ssd"}'
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            type="textarea"
            :rows="2"
            v-model="deployForm.labels_str"
            placeholder='可选，JSON 格式，如 {"app":"knowledge"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deployDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitDeploy">立即部署</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 知识库详情弹窗 -->
    <el-dialog title="知识库详情" v-model="detailDialogVisible" width="50%">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="名称">
          {{ knowledgeDetail.name }}
        </el-descriptions-item>
        <el-descriptions-item label="命名空间">
          {{ knowledgeDetail.namespace }}
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ knowledgeDetail.type }}
        </el-descriptions-item>
        <el-descriptions-item label="镜像">
          {{ knowledgeDetail.image }}
        </el-descriptions-item>
        <el-descriptions-item label="端口">
          {{ knowledgeDetail.port }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ knowledgeDetail.status }}
        </el-descriptions-item>
        <el-descriptions-item label="Pod 数量">
          {{ knowledgeDetail.ready_pods }} / {{ knowledgeDetail.pods }}
        </el-descriptions-item>
        <el-descriptions-item label="存储大小">
          {{ knowledgeDetail.storage_size }}
        </el-descriptions-item>
        <el-descriptions-item label="Service 名称">
          {{ knowledgeDetail.service_name }}
        </el-descriptions-item>
        <el-descriptions-item label="PVC 名称">
          {{ knowledgeDetail.pvc_name }}
        </el-descriptions-item>
        <el-descriptions-item label="Ollama Pod 名称">
          {{ knowledgeDetail.ollama_pod_name }}
        </el-descriptions-item>
        <el-descriptions-item label="Ollama 模型">
          {{ knowledgeDetail.ollama_model }}
        </el-descriptions-item>
        <el-descriptions-item label="Ollama 命名空间">
          {{ knowledgeDetail.ollama_namespace }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ knowledgeDetail.created_at }}
        </el-descriptions-item>
      </el-descriptions>
      <el-row :gutter="10" style="margin-top: 10px">
        <el-col :span="12">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="knowledge-section-title">标签</div>
            <div v-if="knowledgeDetail.labels">
              <el-tag
                v-for="(val, key) in knowledgeDetail.labels"
                :key="key"
                type="info"
                style="margin: 2px"
              >
                {{ key }}={{ val }}
              </el-tag>
            </div>
            <div v-else>-</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="knowledge-section-title">注解</div>
            <div v-if="knowledgeDetail.annotations">
              <div
                v-for="(val, key) in knowledgeDetail.annotations"
                :key="key"
                style="font-size: 12px; margin: 2px 0"
              >
                <span style="font-weight: 600">{{ key }}: </span>{{ val }}
              </div>
            </div>
            <div v-else>-</div>
          </el-card>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关 闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传文档弹窗 -->
    <el-dialog title="上传文档到知识库" v-model="uploadDialogVisible" width="40%">
      <el-form :model="uploadForm" label-width="120px">
        <el-form-item label="Pod 名称">
          <el-input
            v-model="uploadForm.pod_name"
            placeholder="请输入知识库 Pod 的实际名称，如 knowledge-base-xxxx"
          />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="uploadForm.namespace" disabled />
        </el-form-item>
        <el-form-item label="知识库类型">
          <el-input v-model="uploadForm.knowledge_type" disabled />
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div style="font-size: 12px; color: #999">
                支持 txt、pdf 等文本类文件，由后端解析为知识库。
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="uploading" @click="submitUpload">
            开始上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查询知识库弹窗 -->
    <el-dialog title="查询知识库" v-model="queryDialogVisible" width="50%">
      <el-form :model="queryForm" label-width="120px">
        <el-form-item label="Pod 名称">
          <el-input
            v-model="queryForm.pod_name"
            placeholder="请输入知识库 Pod 的实际名称，如 knowledge-base-xxxx"
          />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="queryForm.namespace" disabled />
        </el-form-item>
        <el-form-item label="知识库类型">
          <el-input v-model="queryForm.knowledge_type" disabled />
        </el-form-item>
        <el-form-item label="集合名称">
          <el-input
            v-model="queryForm.collection_name"
            placeholder="如：test_txt，需与上传时后端创建的集合名一致"
          />
        </el-form-item>
        <el-form-item label="查询文本">
          <el-input
            type="textarea"
            :rows="3"
            v-model="queryForm.query_text"
            placeholder="请输入要查询的问题或关键字"
          />
        </el-form-item>
        <el-form-item label="Top K">
          <el-input v-model.number="queryForm.top_k" placeholder="默认：5" />
        </el-form-item>
      </el-form>
      <el-row :gutter="10" style="margin-top: 10px">
        <el-col :span="24">
          <el-card shadow="never" :body-style="{ padding: '10px' }">
            <div class="knowledge-section-title">查询结果</div>
            <div v-if="queryResult && queryResult.results">
              <div
                v-for="(docList, idx) in queryResult.results.documents || []"
                :key="idx"
                class="knowledge-query-item"
              >
                <div class="knowledge-query-doc">
                  {{ (docList && docList[0]) || "" }}
                </div>
                <div class="knowledge-query-meta">
                  <span v-if="queryResult.results.metadatas && queryResult.results.metadatas[idx]">
                    来源：
                    {{
                      (queryResult.results.metadatas[idx][0] &&
                        queryResult.results.metadatas[idx][0].source) ||
                      ""
                    }}
                  </span>
                  <span v-if="queryResult.results.distances && queryResult.results.distances[idx]">
                    距离：
                    {{ queryResult.results.distances[idx][0] }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else style="font-size: 12px; color: #999">
              暂无结果，请先上传文档或调整查询条件。
            </div>
          </el-card>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="queryDialogVisible = false">关 闭</el-button>
          <el-button type="primary" :loading="querying" @click="submitQuery">
            查询
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getNamespecelist } from "@/api/namespace";
import {
  getKnowledgeList,
  deployKnowledge,
  getKnowledgeDetail,
  uploadKnowledgeDocument,
  queryKnowledge,
} from "@/api/knowledge";

export default {
  name: "Knowledge",
  data() {
    return {
      // 命名空间
      namespaceValue: "default",
      namespaceList: [],

      // 列表
      appLoading: false,
      knowledgeList: [],
      knowledgeTotal: 0,
      currentPage: 1,
      pagesize: 10,
      pagesizeList: [10, 20, 30],
      searchInput: "",

      // 部署
      fullscreenLoading: false,
      deployDialogVisible: false,
      deployForm: {
        name: "",
        namespace: "",
        image: "chromadb/chroma:latest",
        port: 8000,
        deploy_type: "deployment",
        storage_size: "0.5Gi",
        storage_class: "",
        ollama_pod_name: "",
        ollama_model: "",
        ollama_namespace: "",
        node_selector: {},
        labels: {},
        // 文本输入（供 JSON 解析）
        node_selector_str: "",
        labels_str: "",
      },
      deployFormRules: {
        name: [{ required: true, message: "请填写名称", trigger: "change" }],
        namespace: [{ required: true, message: "请选择命名空间", trigger: "change" }],
        image: [{ required: true, message: "请填写镜像", trigger: "change" }],
        port: [{ required: true, message: "请填写端口", trigger: "change" }],
        deploy_type: [{ required: true, message: "请选择部署类型", trigger: "change" }],
        storage_size: [{ required: true, message: "请选择存储大小", trigger: "change" }],
        ollama_pod_name: [{ required: true, message: "请填写 Ollama Pod 名称", trigger: "change" }],
        ollama_model: [{ required: true, message: "请填写 Ollama 模型", trigger: "change" }],
        ollama_namespace: [{ required: true, message: "请填写 Ollama 命名空间", trigger: "change" }],
      },

      // 详情
      detailDialogVisible: false,
      knowledgeDetail: {},

      // 上传文档
      uploadDialogVisible: false,
      uploadForm: {
        pod_name: "",
        namespace: "",
        knowledge_type: "chromadb",
      },
      uploadFile: null,
      uploading: false,

      // 查询知识库
      queryDialogVisible: false,
      queryForm: {
        pod_name: "",
        namespace: "",
        knowledge_type: "chromadb",
        collection_name: "",
        query_text: "",
        top_k: 5,
      },
      queryResult: null,
      querying: false,
    };
  },
  methods: {
    ellipsis(value) {
      if (!value) {
        return "-";
      }
      return value.length > 20 ? value.substring(0, 20) + "..." : value;
    },
    handleSizeChange(size) {
      this.pagesize = size;
      this.getKnowledgeListFunc();
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.getKnowledgeListFunc();
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
    getKnowledgeListFunc() {
      this.appLoading = true;
      const params = {
        namespace: this.namespaceValue,
        page: this.currentPage,
        limit: this.pagesize,
      };
      // 当前后端示例未提供分页参数，但这里预留，后端可按需实现
      getKnowledgeList(params)
        .then((res) => {
          this.knowledgeList = (res.data && res.data.items) || [];
          this.knowledgeTotal = (res.data && res.data.total) || this.knowledgeList.length;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取知识库列表失败",
          });
        })
        .finally(() => {
          this.appLoading = false;
        });
    },
    openDeployDialog() {
      this.deployForm.namespace = this.namespaceValue;
      this.deployForm.ollama_namespace = this.namespaceValue;
      this.deployDialogVisible = true;
    },
    submitDeploy() {
      this.$refs.deployFormRef.validate((valid) => {
        if (!valid) {
          return;
        }
        // 解析 node_selector 和 labels 的 JSON 文本
        if (this.deployForm.node_selector_str) {
          try {
            this.deployForm.node_selector = JSON.parse(this.deployForm.node_selector_str);
          } catch (e) {
            this.$message.warning({
              message: "节点选择器 JSON 格式有误，请检查",
            });
            return;
          }
        } else {
          this.deployForm.node_selector = {};
        }
        if (this.deployForm.labels_str) {
          try {
            this.deployForm.labels = JSON.parse(this.deployForm.labels_str);
          } catch (e) {
            this.$message.warning({
              message: "标签 JSON 格式有误，请检查",
            });
            return;
          }
        } else {
          this.deployForm.labels = {};
        }

        this.fullscreenLoading = true;
        const payload = {
          name: this.deployForm.name,
          namespace: this.deployForm.namespace,
          image: this.deployForm.image,
          port: Number(this.deployForm.port),
          deploy_type: this.deployForm.deploy_type,
          storage_size: this.deployForm.storage_size,
          storage_class: this.deployForm.storage_class,
          ollama_pod_name: this.deployForm.ollama_pod_name,
          ollama_model: this.deployForm.ollama_model,
          ollama_namespace: this.deployForm.ollama_namespace,
          node_selector: this.deployForm.node_selector,
          labels: this.deployForm.labels,
        };
        deployKnowledge(payload)
          .then((res) => {
            this.$message.success({
              message: res.msg || "部署任务已提交",
            });
            this.deployDialogVisible = false;
            this.getKnowledgeListFunc();
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
    openDetailDialog(row) {
      const params = {
        name: row.name,
        namespace: row.namespace,
      };
      getKnowledgeDetail(params)
        .then((res) => {
          this.knowledgeDetail = res.data || {};
          this.detailDialogVisible = true;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取详情失败",
          });
        });
    },
    openUploadDialog(row) {
      this.uploadForm.pod_name = "";
      this.uploadForm.namespace = row.namespace || this.namespaceValue;
      this.uploadForm.knowledge_type = "chromadb";
      this.uploadFile = null;
      this.uploadDialogVisible = true;
    },
    handleFileChange(file) {
      this.uploadFile = file.raw;
    },
    handleFileRemove() {
      this.uploadFile = null;
    },
    submitUpload() {
      if (!this.uploadFile) {
        this.$message.warning({
          message: "请先选择文件",
        });
        return;
      }
      this.uploading = true;
      const formData = new FormData();
      formData.append("file", this.uploadFile);
      formData.append("pod_name", this.uploadForm.pod_name);
      formData.append("namespace", this.uploadForm.namespace);
      formData.append("knowledge_type", this.uploadForm.knowledge_type);
      uploadKnowledgeDocument(formData)
        .then((res) => {
          this.$message.success({
            message: (res.data && res.data.message) || res.msg || "文档上传成功",
          });
          this.uploadDialogVisible = false;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "上传失败",
          });
        })
        .finally(() => {
          this.uploading = false;
        });
    },
    openQueryDialog(row) {
      this.queryForm.pod_name = "";
      this.queryForm.namespace = row.namespace || this.namespaceValue;
      this.queryForm.knowledge_type = "chromadb";
      this.queryForm.collection_name = "";
      this.queryForm.query_text = "";
      this.queryForm.top_k = 5;
      this.queryResult = null;
      this.queryDialogVisible = true;
    },
    submitQuery() {
      if (!this.queryForm.collection_name) {
        this.$message.warning({
          message: "请填写集合名称",
        });
        return;
      }
      if (!this.queryForm.query_text) {
        this.$message.warning({
          message: "请填写查询文本",
        });
        return;
      }
      this.querying = true;
      const payload = {
        pod_name: this.queryForm.pod_name,
        namespace: this.queryForm.namespace,
        knowledge_type: this.queryForm.knowledge_type,
        collection_name: this.queryForm.collection_name,
        query_text: this.queryForm.query_text,
        top_k: this.queryForm.top_k || 5,
      };
      queryKnowledge(payload)
        .then((res) => {
          this.queryResult = res.data || null;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "查询失败",
          });
        })
        .finally(() => {
          this.querying = false;
        });
    },
  },
  watch: {
    namespaceValue: {
      handler() {
        localStorage.setItem("namespace", this.namespaceValue);
        this.currentPage = 1;
        this.getKnowledgeListFunc();
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
    this.getKnowledgeListFunc();
  },
};
</script>

<style scoped>
.knowledge-head-card,
.knowledge-body-card {
  border-radius: 1px;
  margin-bottom: 5px;
}

.knowledge-head-search {
  width: 200px;
  margin-right: 10px;
}

.knowledge-body-name {
  color: #4795ee;
}

.knowledge-body-name:hover {
  color: rgb(84, 138, 238);
  cursor: pointer;
  font-weight: bold;
}

.knowledge-body-pagination {
  margin-top: 5px;
  text-align: right;
}

.knowledge-ollama-tag {
  font-size: 12px;
}

.knowledge-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.knowledge-query-item {
  border-bottom: 1px dashed #e5e5e5;
  padding: 6px 0;
}

.knowledge-query-doc {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.knowledge-query-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}
</style>
