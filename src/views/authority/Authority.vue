<template>
  <div class="authority">
    <el-row>
      <el-col :span="24">
        <div>
          <el-card
            class="authority-head-card"
            shadow="never"
            :body-style="{ padding: '10px' }"
          >
            <el-row>
              <el-col :span="2">
                <div>
                  <el-button
                    style="border-radius: 2px"
                    icon="Plus"
                    type="primary"
                    @click="handleCreate"
                    >创建角色</el-button
                  >
                </div>
              </el-col>
              <el-col :span="6">
                <div>
                  <el-input
                    class="authority-head-search"
                    clearable
                    placeholder="请输入角色名称"
                    v-model="searchInput"
                    @keyup.enter="handleSearch"
                  ></el-input>
                  <el-button
                    style="border-radius: 2px"
                    icon="Search"
                    type="primary"
                    plain
                    @click="handleSearch"
                    >搜索</el-button
                  >
                </div>
              </el-col>
              <el-col :span="2" :offset="14">
                <div>
                  <el-button
                    style="border-radius: 2px"
                    icon="Refresh"
                    plain
                    @click="handleRefresh"
                    >刷新</el-button
                  >
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-col>
      <el-col :span="24">
        <div>
          <el-card
            class="authority-body-card"
            shadow="never"
            :body-style="{ padding: '5px' }"
          >
            <el-table
              style="width: 100%; font-size: 12px; margin-bottom: 10px"
              :data="authorityList"
              v-loading="appLoading"
            >
              <el-table-column width="20"></el-table-column>
              <el-table-column align="left" label="角色ID" prop="authorityId" width="120">
              </el-table-column>
              <el-table-column align="left" label="角色名称" prop="authorityName">
              </el-table-column>
              <el-table-column align="center" label="父角色ID" prop="parentId" width="120">
                <template v-slot="scope">
                  <span v-if="scope.row.parentId === 0">-</span>
                  <span v-else>{{ scope.row.parentId }}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" label="创建时间" min-width="180">
                <template v-slot="scope">
                  <el-tag type="info">{{
                    timeTrans(scope.row.created_at)
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column align="center" label="操作" width="400">
                <template v-slot="scope">
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="Edit"
                    type="primary"
                    plain
                    @click="handleEdit(scope.row)"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="Setting"
                    type="warning"
                    plain
                    @click="handleApiPermission(scope.row)"
                    >API权限</el-button
                  >
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="Menu"
                    type="success"
                    plain
                    @click="handleMenuPermission(scope.row)"
                    >菜单权限</el-button
                  >
                  <el-button
                    size="small"
                    style="border-radius: 2px"
                    icon="Delete"
                    type="danger"
                    @click="handleConfirm(scope.row, '删除', deleteAuthority)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="authority-body-pagination"
              background
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="pagesizeList"
              :page-size="pagesize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="authorityTotal"
            >
            </el-pagination>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="roleDialog"
      width="500px"
      @close="resetRoleForm"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色ID" prop="authorityId">
          <el-input
            v-model="roleForm.authorityId"
            :disabled="isEdit"
            placeholder="请输入角色ID"
          ></el-input>
        </el-form-item>
        <el-form-item label="角色名称" prop="authorityName">
          <el-input
            v-model="roleForm.authorityName"
            placeholder="请输入角色名称"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialog = false">取 消</el-button>
          <el-button type="primary" @click="submitRole">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- API权限分配对话框 -->
    <el-dialog
      title="API权限分配"
      v-model="apiPermissionDialog"
      width="70%"
      @close="resetApiPermission"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <div style="margin-bottom: 10px">
            <el-input
              v-model="apiSearchInput"
              placeholder="搜索API"
              clearable
              @input="filterApiList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <el-table
            ref="apiTableRef"
            :data="filteredApiList"
            height="500"
            @selection-change="handleApiSelectionChange"
            row-key="id"
          >
            <el-table-column type="selection" width="55" :reserve-selection="true">
            </el-table-column>
            <el-table-column prop="path" label="API路径" min-width="250">
            </el-table-column>
            <el-table-column prop="method" label="方法" width="100">
              <template v-slot="scope">
                <el-tag :type="getMethodTagType(scope.row.method)" size="small">
                  {{ scope.row.method }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="apiGroup" label="分组" width="100">
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150">
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="12">
          <div style="margin-bottom: 10px">
            <span>已选权限 ({{ selectedApis.length }})</span>
            <span style="margin-left: 10px; color: #67c23a; font-size: 12px;">
              新增: {{ newApis.length }}
            </span>
          </div>
          <el-table :data="selectedApis" height="500">
            <el-table-column prop="path" label="API路径" min-width="250">
            </el-table-column>
            <el-table-column prop="method" label="方法" width="100">
              <template v-slot="scope">
                <el-tag :type="getMethodTagType(scope.row.method)" size="small">
                  {{ scope.row.method }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="apiGroup" label="分组" width="100">
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150">
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template v-slot="scope">
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removeApi(scope.row)"
                  >移除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="apiPermissionDialog = false">取 消</el-button>
          <el-button type="primary" @click="submitApiPermission">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 菜单权限分配对话框 -->
    <el-dialog
      title="菜单权限分配"
      v-model="menuPermissionDialog"
      width="50%"
      @close="resetMenuPermission"
    >
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="menuTreeProps"
        show-checkbox
        node-key="ID"
        :default-checked-keys="selectedMenuIds"
        @check="handleMenuCheck"
      >
        <template #default="{ node, data }">
          <span>{{ data.meta.title || data.name }}</span>
        </template>
      </el-tree>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="menuPermissionDialog = false">取 消</el-button>
          <el-button type="primary" @click="submitMenuPermission">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAuthorityList,
  createAuthority,
  updateAuthority,
  deleteAuthority as deleteAuthorityApi,
  getPolicyPathByAuthorityId,
  updateCasbinByAuthority,
  getMenuByAuthID,
  getBaseMenuTree,
  addMenuAuthority,
  getAPiList,
} from "@/api/authority";

export default {
  name: "Authority",
  data() {
    return {
      searchInput: "",
      appLoading: false,
      authorityList: [],
      authorityTotal: 0,
      currentPage: 1,
      pagesize: 10,
      pagesizeList: [10, 20, 30],
      isLoading: false, // 防止重复请求

      // 角色对话框
      roleDialog: false,
      dialogTitle: "创建角色",
      isEdit: false,
      roleForm: {
        authorityId: "",
        authorityName: "",
      },
      roleRules: {
        authorityId: [
          { required: true, message: "请输入角色ID", trigger: "blur" },
        ],
        authorityName: [
          { required: true, message: "请输入角色名称", trigger: "blur" },
        ],
      },
      roleFormRef: null,

      // API权限对话框
      apiPermissionDialog: false,
      currentAuthorityId: null,
      apiList: [],
      filteredApiList: [],
      apiSearchInput: "",
      selectedApis: [],
      existingApis: [], // 现有的权限
      newApis: [], // 新添加的权限
      apiTableRef: null,

      // 菜单权限对话框
      menuPermissionDialog: false,
      menuTree: [],
      menuTreeProps: {
        children: "children",
        label: "meta.title",
      },
      selectedMenuIds: [],
      menuTreeRef: null,
    };
  },
  mounted() {
    this.getAuthorityList();
  },
  methods: {
    // 获取角色列表
    getAuthorityList() {
      // 防止重复请求
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      this.appLoading = true;
      getAuthorityList({
        page: this.currentPage,
        pageSize: this.pagesize,
        keyword: this.searchInput,
      })
        .then((res) => {
          this.authorityList = res.data.list || [];
          this.authorityTotal = res.data.total || 0;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取角色列表失败",
          });
        })
        .finally(() => {
          this.appLoading = false;
          this.isLoading = false;
        });
    },

    // 搜索
    handleSearch() {
      this.currentPage = 1; // 搜索时重置到第一页
      this.getAuthorityList();
    },

    // 刷新
    handleRefresh() {
      this.searchInput = ""; // 清空搜索条件
      this.currentPage = 1;
      this.getAuthorityList();
    },

    // 分页
    handleSizeChange(size) {
      this.pagesize = size;
      this.currentPage = 1; // 改变每页数量时重置到第一页
      this.getAuthorityList();
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.getAuthorityList();
    },

    // 时间转换
    timeTrans(timestamp) {
      if (!timestamp) return "-";
      let date = new Date(new Date(timestamp).getTime() + 8 * 3600 * 1000);
      date = date.toJSON();
      date = date.substring(0, 19).replace("T", " ");
      return date;
    },

    // 创建角色
    handleCreate() {
      this.dialogTitle = "创建角色";
      this.isEdit = false;
      this.roleDialog = true;
    },

    // 编辑角色
    handleEdit(row) {
      this.dialogTitle = "编辑角色";
      this.isEdit = true;
      this.roleForm = {
        authorityId: row.authorityId,
        authorityName: row.authorityName,
      };
      this.roleDialog = true;
    },

    // 重置角色表单
    resetRoleForm() {
      this.roleForm = {
        authorityId: "",
        authorityName: "",
      };
      if (this.roleFormRef) {
        this.roleFormRef.resetFields();
      }
    },

    // 提交角色
    submitRole() {
      this.$refs.roleFormRef.validate((valid) => {
        if (valid) {
          // 后端接口需要下划线格式的参数
          const params = {
            authority_id: Number(this.roleForm.authorityId),
            authority_name: this.roleForm.authorityName,
          };
          const api = this.isEdit ? updateAuthority : createAuthority;
          api(params)
            .then((res) => {
              this.$message.success({
                message: res.msg || "操作成功",
              });
              this.roleDialog = false;
              this.getAuthorityList();
            })
            .catch((res) => {
              this.$message.error({
                message: res.msg || "操作失败",
              });
            });
        }
      });
    },

    // 删除角色
    deleteAuthority(row) {
      deleteAuthorityApi(row.authorityId)
        .then((res) => {
          this.$message.success({
            message: res.msg || "删除成功",
          });
          this.getAuthorityList();
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "删除失败",
          });
        });
    },

    // 确认对话框
    handleConfirm(obj, operateName, fn) {
      this.$confirm(`确认继续 ${operateName} 操作吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(() => {
          fn(obj);
        })
        .catch(() => {
          this.$message.info({
            message: "已取消操作",
          });
        });
    },

    // API权限分配
    handleApiPermission(row) {
      this.currentAuthorityId = row.authorityId;
      this.apiPermissionDialog = true;
      this.loadApiList();
      this.loadRoleApiPermission();
    },

    // 加载API列表
    loadApiList() {
      getAPiList()
        .then((res) => {
          // 返回格式是 data 数组
          this.apiList = res.data || [];
          this.filteredApiList = this.apiList;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取API列表失败",
          });
        });
    },

    // 加载角色已有的API权限
    loadRoleApiPermission() {
      getPolicyPathByAuthorityId(this.currentAuthorityId)
        .then((res) => {
          const policies = res.data || [];
          // 保存现有权限
          this.existingApis = policies.map((item) => ({
            id: item.id || `${item.path}-${item.method}`,
            path: item.path,
            method: item.method,
            apiGroup: item.apiGroup || "",
            description: item.description || "",
          }));
          // 初始化已选权限为现有权限
          this.selectedApis = [...this.existingApis];
          this.newApis = [];
          
          // 设置表格选中状态
          this.$nextTick(() => {
            if (this.$refs.apiTableRef && this.filteredApiList.length > 0) {
              this.filteredApiList.forEach((row) => {
                const isSelected = this.selectedApis.some(
                  (api) => api.path === row.path && api.method === row.method
                );
                if (isSelected) {
                  this.$refs.apiTableRef.toggleRowSelection(row, true);
                }
              });
            }
          });
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取权限失败",
          });
        });
    },

    // 过滤API列表
    filterApiList() {
      if (!this.apiSearchInput) {
        this.filteredApiList = this.apiList;
        return;
      }
      const keyword = this.apiSearchInput.toLowerCase();
      this.filteredApiList = this.apiList.filter(
        (item) =>
          item.path.toLowerCase().includes(keyword) ||
          item.method.toLowerCase().includes(keyword) ||
          (item.description && item.description.toLowerCase().includes(keyword)) ||
          (item.apiGroup && item.apiGroup.toLowerCase().includes(keyword))
      );
    },

    // API选择变化
    handleApiSelectionChange(selection) {
      // 更新已选API列表
      this.selectedApis = selection.map((item) => ({
        id: item.id,
        path: item.path,
        method: item.method,
        apiGroup: item.apiGroup || "",
        description: item.description || "",
      }));
      
      // 计算新添加的权限（已选权限中不在现有权限中的）
      this.newApis = this.selectedApis.filter(
        (selected) =>
          !this.existingApis.some(
            (existing) =>
              existing.path === selected.path &&
              existing.method === selected.method
          )
      );
    },

    // 移除API
    removeApi(row) {
      const index = this.selectedApis.findIndex(
        (item) => item.path === row.path && item.method === row.method
      );
      if (index > -1) {
        this.selectedApis.splice(index, 1);
        // 同时取消表格中的选中状态
        if (this.$refs.apiTableRef) {
          const apiItem = this.filteredApiList.find(
            (item) => item.path === row.path && item.method === row.method
          );
          if (apiItem) {
            this.$refs.apiTableRef.toggleRowSelection(apiItem, false);
          }
        }
      }
    },

    // 获取方法标签类型
    getMethodTagType(method) {
      const methodUpper = method?.toUpperCase();
      const typeMap = {
        GET: "success",
        POST: "primary",
        PUT: "warning",
        DELETE: "danger",
        PATCH: "info",
      };
      return typeMap[methodUpper] || "";
    },

    // 重置API权限
    resetApiPermission() {
      this.selectedApis = [];
      this.existingApis = [];
      this.newApis = [];
      this.apiSearchInput = "";
      this.currentAuthorityId = null;
      // 清空表格选中状态
      if (this.$refs.apiTableRef) {
        this.$refs.apiTableRef.clearSelection();
      }
    },

    // 提交API权限
    submitApiPermission() {
      // 只提交新添加的权限（在现有权限基础上添加）
      if (this.newApis.length === 0) {
        this.$message.info({
          message: "没有新增权限",
        });
        return;
      }

      const casbinInfo = this.newApis.map((item) => ({
        path: item.path,
        method: item.method,
      }));

      updateCasbinByAuthority({
        authority_id: this.currentAuthorityId,
        casbin_info: casbinInfo,
      })
        .then((res) => {
          this.$message.success({
            message: res.msg || "权限添加成功",
          });
          this.apiPermissionDialog = false;
          // 重新加载权限列表
          this.loadRoleApiPermission();
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "权限添加失败",
          });
        });
    },

    // 菜单权限分配
    handleMenuPermission(row) {
      this.currentAuthorityId = row.authorityId;
      this.menuPermissionDialog = true;
      this.loadMenuTree();
      this.loadRoleMenuPermission();
    },

    // 加载菜单树
    loadMenuTree() {
      getBaseMenuTree()
        .then((res) => {
          this.menuTree = res.data || [];
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取菜单树失败",
          });
        });
    },

    // 加载角色已有的菜单权限
    loadRoleMenuPermission() {
      getMenuByAuthID(this.currentAuthorityId)
        .then((res) => {
          const menus = res.data || [];
          this.selectedMenuIds = menus.map((item) => item.ID || item.id);
          // 设置树形控件的选中状态
          this.$nextTick(() => {
            if (this.$refs.menuTreeRef) {
              this.$refs.menuTreeRef.setCheckedKeys(this.selectedMenuIds);
            }
          });
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "获取菜单权限失败",
          });
        });
    },

    // 菜单选择变化
    handleMenuCheck(data, checked) {
      // 处理菜单选择
    },

    // 重置菜单权限
    resetMenuPermission() {
      this.selectedMenuIds = [];
      this.currentAuthorityId = null;
    },

    // 提交菜单权限
    submitMenuPermission() {
      const checkedKeys = this.$refs.menuTreeRef.getCheckedKeys();
      const halfCheckedKeys = this.$refs.menuTreeRef.getHalfCheckedKeys();
      const menuIds = [...checkedKeys, ...halfCheckedKeys];

      addMenuAuthority({
        authority_id: this.currentAuthorityId,
        menus: menuIds,
      })
        .then((res) => {
          this.$message.success({
            message: res.msg || "菜单权限分配成功",
          });
          this.menuPermissionDialog = false;
        })
        .catch((res) => {
          this.$message.error({
            message: res.msg || "菜单权限分配失败",
          });
        });
    },
  },
};
</script>

<style scoped>
.authority-head-card,
.authority-body-card {
  border-radius: 1px;
  margin-bottom: 5px;
}
.authority-head-search {
  width: 200px;
  margin-right: 10px;
}
.authority-body-pagination {
  margin-top: 10px;
  text-align: right;
}
</style>

