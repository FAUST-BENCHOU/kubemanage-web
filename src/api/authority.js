import request from "@/utils/request";

// 获取角色列表
export function getAuthorityList(query) {
    return request({
        url: '/api/authority/getAuthorityList',
        method: 'get',
        params: query
    })
}

// 创建角色
export function createAuthority(data) {
    return request({
        url: '/api/authority/createAuthority',
        method: 'post',
        data
    })
}

// 更新角色
export function updateAuthority(data) {
    return request({
        url: '/api/authority/updateAuthority',
        method: 'put',
        data
    })
}

// 删除角色
export function deleteAuthority(authID) {
    return request({
        url: `/api/authority/${authID}/delAuthority`,
        method: 'delete'
    })
}

// 获取角色的 API 权限
export function getPolicyPathByAuthorityId(authorityId) {
    return request({
        url: '/api/authority/getPolicyPathByAuthorityId',
        method: 'get',
        params: {
            authorityId: authorityId
        }
    })
}

// 更新角色的 API 权限
export function updateCasbinByAuthority(data) {
    return request({
        url: '/api/authority/updateCasbinByAuthority',
        method: 'post',
        data
    })
}

// 根据角色获取菜单
export function getMenuByAuthID(authID) {
    return request({
        url: `/api/menu/${authID}/getMenuByAuthID`,
        method: 'get'
    })
}

// 获取菜单总树
export function getBaseMenuTree() {
    return request({
        url: '/api/menu/getBaseMenuTree',
        method: 'get'
    })
}

// 添加菜单
export function addBaseMenu(data) {
    return request({
        url: '/api/menu/add_base_menu',
        method: 'post',
        data
    })
}

// 为角色分配菜单权限
export function addMenuAuthority(data) {
    return request({
        url: '/api/menu/add_menu_authority',
        method: 'post',
        data
    })
}


// 获取系统 API 列表
export function getAPiList(query) {
    return request({
        url: '/api/sysApi/getAPiList',
        method: 'get',
        params: query
    })
}

// 设置用户角色
export function setUserAuth(id, data) {
    return request({
        url: `/api/user/${id}/set_auth`,
        method: 'post',
        data
    })
}

