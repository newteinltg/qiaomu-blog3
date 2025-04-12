export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">测试页面</h1>
      <p className="mb-4">这是一个简单的测试页面，用于检查是否有遮罩层问题。</p>
      <div className="bg-blue-100 p-4 rounded">
        <p>如果您能看到这段文字，说明页面正常显示，没有遮罩层问题。</p>
      </div>
    </div>
  );
}
