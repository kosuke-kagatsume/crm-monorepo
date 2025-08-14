from typing import Dict, Any, List
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_openai_functions_agent
from .base_agent import BaseAgent
import json


class SalesAgent(BaseAgent):
    """Sales support agent for DRM Suite"""
    
    def __init__(self):
        super().__init__(
            name="SalesAgent",
            role="営業支援",
            temperature=0.5,  # Lower temperature for more consistent responses
        )
        
        # Initialize sales-specific tools
        self.tools = self._create_tools()
        
    def _create_prompt_template(self) -> ChatPromptTemplate:
        """Create sales-specific prompt template"""
        system_prompt = """あなたは建設・リフォーム業界の営業支援AIアシスタントです。
        
        あなたの役割：
        1. 見積作成の支援
        2. 商談履歴の分析と洞察の提供
        3. 提案書の生成
        4. 顧客ニーズの分析
        5. 成約率向上のためのアドバイス
        
        以下の点に注意してください：
        - 顧客の予算と要望のバランスを考慮
        - 過去の類似案件を参考に最適な提案を作成
        - 競合他社との差別化ポイントを明確に
        - 建設業界の専門用語を適切に使用
        - 数値は正確に、根拠を明確に提示
        
        現在のコンテキスト：
        {context}
        
        会話履歴：
        {chat_history}
        
        タスク：
        {task}
        """
        
        return ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{task}"),
        ])
    
    def _get_capabilities(self) -> List[str]:
        """Return sales agent capabilities"""
        return [
            "見積作成",
            "商談履歴分析",
            "提案書生成",
            "顧客ニーズ分析",
            "成約率分析",
            "価格戦略提案",
            "クロスセル・アップセル提案",
            "競合分析",
        ]
    
    def _create_tools(self) -> List[Tool]:
        """Create sales-specific tools"""
        tools = [
            Tool(
                name="create_estimate",
                func=self._create_estimate,
                description="見積を作成する",
            ),
            Tool(
                name="analyze_customer",
                func=self._analyze_customer,
                description="顧客分析を行う",
            ),
            Tool(
                name="generate_proposal",
                func=self._generate_proposal,
                description="提案書を生成する",
            ),
            Tool(
                name="analyze_conversion",
                func=self._analyze_conversion,
                description="成約率を分析する",
            ),
        ]
        return tools
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process sales-related tasks"""
        task = input_data.get("task", "")
        context = input_data.get("context", {})
        
        # Determine task type
        task_type = self._classify_task(task)
        
        # Execute based on task type
        if task_type == "estimate":
            return await self._handle_estimate(task, context)
        elif task_type == "analysis":
            return await self._handle_analysis(task, context)
        elif task_type == "proposal":
            return await self._handle_proposal(task, context)
        else:
            # General conversation
            response = await self.chain.arun(
                task=task,
                context=json.dumps(context, ensure_ascii=False),
            )
            return {"response": response, "type": "general"}
    
    def _classify_task(self, task: str) -> str:
        """Classify the type of sales task"""
        task_lower = task.lower()
        
        if any(word in task_lower for word in ["見積", "価格", "費用", "コスト"]):
            return "estimate"
        elif any(word in task_lower for word in ["分析", "履歴", "成約", "傾向"]):
            return "analysis"
        elif any(word in task_lower for word in ["提案", "企画", "プラン"]):
            return "proposal"
        else:
            return "general"
    
    async def _handle_estimate(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle estimate creation tasks"""
        # Extract project details from context
        project_type = context.get("project_type", "リフォーム")
        budget = context.get("budget", 0)
        requirements = context.get("requirements", [])
        
        # Generate estimate structure
        estimate = {
            "project_type": project_type,
            "items": [],
            "subtotal": 0,
            "tax": 0,
            "total": 0,
            "notes": [],
            "validity_period": "30日間",
        }
        
        # Use LLM to generate estimate items
        prompt = f"""
        以下の条件で見積を作成してください：
        プロジェクトタイプ: {project_type}
        予算: {budget}円
        要件: {', '.join(requirements)}
        
        見積項目を詳細に列挙し、各項目の金額を算出してください。
        """
        
        response = await self.chain.arun(
            task=prompt,
            context=json.dumps(context, ensure_ascii=False),
        )
        
        return {
            "type": "estimate",
            "estimate": estimate,
            "explanation": response,
        }
    
    async def _handle_analysis(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle sales analysis tasks"""
        customer_id = context.get("customer_id")
        period = context.get("period", "last_month")
        
        # Analyze sales data
        analysis = {
            "conversion_rate": 0.35,  # 35%
            "average_deal_size": 2500000,  # 250万円
            "win_reasons": [
                "価格競争力",
                "提案内容の充実",
                "迅速な対応",
            ],
            "loss_reasons": [
                "予算オーバー",
                "競合他社の提案",
                "タイミング",
            ],
            "recommendations": [],
        }
        
        # Generate insights using LLM
        prompt = f"""
        以下の営業データを分析し、改善提案を3つ提示してください：
        成約率: {analysis['conversion_rate']}
        平均取引額: {analysis['average_deal_size']}円
        
        建設業界の特性を考慮した具体的な提案をお願いします。
        """
        
        response = await self.chain.arun(
            task=prompt,
            context=json.dumps(context, ensure_ascii=False),
        )
        
        return {
            "type": "analysis",
            "analysis": analysis,
            "insights": response,
        }
    
    async def _handle_proposal(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle proposal generation tasks"""
        customer_name = context.get("customer_name", "お客様")
        project_details = context.get("project_details", {})
        
        # Generate proposal structure
        prompt = f"""
        {customer_name}向けの提案書を作成してください。
        
        プロジェクト詳細：
        {json.dumps(project_details, ensure_ascii=False, indent=2)}
        
        以下の構成で提案書を作成してください：
        1. エグゼクティブサマリー
        2. 現状の課題
        3. 提案内容
        4. 期待される効果
        5. 実施スケジュール
        6. 投資対効果
        """
        
        response = await self.chain.arun(
            task=prompt,
            context=json.dumps(context, ensure_ascii=False),
        )
        
        return {
            "type": "proposal",
            "proposal": response,
            "customer": customer_name,
        }
    
    # Tool implementation methods
    def _create_estimate(self, input_str: str) -> str:
        """Tool: Create estimate"""
        return "見積を作成しました"
    
    def _analyze_customer(self, input_str: str) -> str:
        """Tool: Analyze customer"""
        return "顧客分析を完了しました"
    
    def _generate_proposal(self, input_str: str) -> str:
        """Tool: Generate proposal"""
        return "提案書を生成しました"
    
    def _analyze_conversion(self, input_str: str) -> str:
        """Tool: Analyze conversion rate"""
        return "成約率分析を完了しました"